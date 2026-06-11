import { Prisma, StockLocation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { transferSchema, type TransferInput } from "@/lib/validators/transfer";
import { recordInventoryMovements } from "@/lib/actions/inventory-movement";

// Business-rule failures (not-found, insufficient stock, …).
export class TransferError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "TransferError";
  }
}

// ── Shared shape + mapper ──────────────────────────────────────────────────
const TRANSFER_INCLUDE = {
  createdBy: { select: { name: true, username: true } },
  variant: {
    select: {
      id: true,
      size: true,
      color: true,
      product: { select: { articleNo: true, articleName: true } },
    },
  },
} satisfies Prisma.StockTransferInclude;

type TransferWithRelations = Prisma.StockTransferGetPayload<{
  include: typeof TRANSFER_INCLUDE;
}>;

export function mapTransfer(t: TransferWithRelations) {
  return {
    id: t.id,
    transferNo: t.transferNo,
    variantId: t.variantId,
    articleNo: t.variant.product.articleNo,
    articleName: t.variant.product.articleName,
    size: t.variant.size,
    color: t.variant.color,
    fromLocation: t.fromLocation,
    toLocation: t.toLocation,
    quantity: t.quantity,
    note: t.note,
    createdAt: t.createdAt.toISOString(),
    createdByName: t.createdBy?.name ?? t.createdBy?.username ?? null,
  };
}

export type TransferDTO = ReturnType<typeof mapTransfer>;

// ── Helpers ────────────────────────────────────────────────────────────────
async function generateTransferNo(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<string> {
  const count = await tx.stockTransfer.count({ where: { companyId } });
  for (let i = 1; i <= 50; i++) {
    const transferNo = `TR-${String(count + i).padStart(4, "0")}`;
    const clash = await tx.stockTransfer.findFirst({
      where: { companyId, transferNo },
      select: { id: true },
    });
    if (!clash) return transferNo;
  }
  throw new TransferError("Could not generate a transfer number", 500);
}

// ── Queries ────────────────────────────────────────────────────────────────
export async function listTransfers(companyId: string) {
  const transfers = await prisma.stockTransfer.findMany({
    where: { companyId },
    include: TRANSFER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return transfers.map(mapTransfer);
}

export async function getTransfer(companyId: string, id: string) {
  const t = await prisma.stockTransfer.findFirst({
    where: { id, companyId },
    include: TRANSFER_INCLUDE,
  });
  return t ? mapTransfer(t) : null;
}

// ── Create a transfer (records the two movements via the Step 8 engine) ────
export async function createTransfer(args: {
  companyId: string;
  userId?: string | null;
  input: TransferInput;
}): Promise<TransferDTO> {
  const parsed = transferSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new TransferError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, userId } = args;

  // Variant must belong to this company; grab current stock for the pre-check.
  const variant = await prisma.productVariant.findFirst({
    where: { id: data.variantId, companyId },
    select: {
      id: true,
      size: true,
      color: true,
      shopQty: true,
      godownQty: true,
      product: { select: { articleName: true } },
    },
  });
  if (!variant) throw new TransferError("Selected variant is invalid", 400);

  // Friendly availability check (the engine still guarantees it atomically).
  const available =
    data.fromLocation === StockLocation.SHOP ? variant.shopQty : variant.godownQty;
  if (data.quantity > available) {
    throw new TransferError(
      `Insufficient ${data.fromLocation} stock for ${variant.product.articleName} ${variant.size}/${variant.color}: available ${available}, need ${data.quantity}`,
      409,
    );
  }

  const transfer = await prisma.$transaction(async (tx) => {
    const transferNo = await generateTransferNo(tx, companyId);
    const created = await tx.stockTransfer.create({
      data: {
        companyId,
        transferNo,
        variantId: data.variantId,
        fromLocation: data.fromLocation,
        toLocation: data.toLocation,
        quantity: data.quantity,
        note: data.note?.trim() || null,
        createdById: userId ?? null,
      },
      select: { id: true },
    });

    // Out of the source location, into the destination — atomically.
    await recordInventoryMovements(
      [
        {
          companyId,
          createdById: userId ?? null,
          input: {
            variantId: data.variantId,
            movementType: "TRANSFER_OUT",
            location: data.fromLocation,
            quantity: data.quantity,
            stockTransferId: created.id,
            note: data.note?.trim() || undefined,
          },
        },
        {
          companyId,
          createdById: userId ?? null,
          input: {
            variantId: data.variantId,
            movementType: "TRANSFER_IN",
            location: data.toLocation,
            quantity: data.quantity,
            stockTransferId: created.id,
            note: data.note?.trim() || undefined,
          },
        },
      ],
      tx,
    );

    return tx.stockTransfer.findUniqueOrThrow({
      where: { id: created.id },
      include: TRANSFER_INCLUDE,
    });
  });

  return mapTransfer(transfer);
}
