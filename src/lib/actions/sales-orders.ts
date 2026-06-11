import {
  Prisma,
  SalesOrderStatus,
  StockLocation,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  salesOrderSchema,
  type SalesOrderInput,
} from "@/lib/validators/sales-order";
import { recordInventoryMovement } from "@/lib/actions/inventory-movement";

// Business-rule failures (not-found, insufficient stock, bad state, …).
export class SalesError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "SalesError";
  }
}

// ── Shared shape + mapper ──────────────────────────────────────────────────
const SO_INCLUDE = {
  createdBy: { select: { name: true, username: true } },
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        select: {
          id: true,
          size: true,
          color: true,
          product: { select: { articleNo: true, articleName: true } },
        },
      },
    },
  },
} satisfies Prisma.SalesOrderInclude;

type SoWithRelations = Prisma.SalesOrderGetPayload<{ include: typeof SO_INCLUDE }>;

export function mapSalesOrder(so: SoWithRelations) {
  return {
    id: so.id,
    invoiceNo: so.invoiceNo,
    status: so.status,
    soldAt: so.soldAt.toISOString(),
    note: so.note,
    totalAmount: Number(so.totalAmount),
    createdByName: so.createdBy?.name ?? so.createdBy?.username ?? null,
    items: so.items.map((it) => ({
      id: it.id,
      variantId: it.variantId,
      articleNo: it.variant.product.articleNo,
      articleName: it.variant.product.articleName,
      size: it.variant.size,
      color: it.variant.color,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      soldFrom: it.soldFrom,
    })),
  };
}

export type SalesOrderDTO = ReturnType<typeof mapSalesOrder>;

// ── Helpers ────────────────────────────────────────────────────────────────
async function generateInvoiceNo(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<string> {
  const count = await tx.salesOrder.count({ where: { companyId } });
  for (let i = 1; i <= 50; i++) {
    const invoiceNo = `INV-${String(count + i).padStart(4, "0")}`;
    const clash = await tx.salesOrder.findFirst({
      where: { companyId, invoiceNo },
      select: { id: true },
    });
    if (!clash) return invoiceNo;
  }
  throw new SalesError("Could not generate an invoice number", 500);
}

interface PricedItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

function priceItems(data: SalesOrderInput): {
  items: PricedItem[];
  totalAmount: number;
} {
  const items = data.items.map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.quantity * i.unitPrice,
  }));
  const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);
  return { items, totalAmount };
}

// Load the variants for a set of items, ensuring they all belong to the company.
async function loadCompanyVariants(companyId: string, variantIds: string[]) {
  const ids = [...new Set(variantIds)];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids }, companyId },
    select: {
      id: true,
      size: true,
      color: true,
      shopQty: true,
      godownQty: true,
      product: { select: { articleName: true } },
    },
  });
  if (variants.length !== ids.length) {
    throw new SalesError("One or more selected variants are invalid", 400);
  }
  return new Map(variants.map((v) => [v.id, v]));
}

// Friendly, up-front availability check (the engine still guarantees it atomically).
function assertStockAvailable(
  variantsMap: Awaited<ReturnType<typeof loadCompanyVariants>>,
  items: PricedItem[],
  location: StockLocation,
) {
  const need = new Map<string, number>();
  for (const it of items) {
    need.set(it.variantId, (need.get(it.variantId) ?? 0) + it.quantity);
  }
  for (const [variantId, required] of need) {
    const v = variantsMap.get(variantId)!;
    const available = location === StockLocation.SHOP ? v.shopQty : v.godownQty;
    if (required > available) {
      throw new SalesError(
        `Insufficient ${location} stock for ${v.product.articleName} ${v.size}/${v.color}: available ${available}, need ${required}`,
        409,
      );
    }
  }
}

// Reduce stock for every line of an order through the Step 8 engine.
async function applySaleMovements(
  tx: Prisma.TransactionClient,
  companyId: string,
  userId: string | null | undefined,
  items: { id: string; variantId: string; quantity: number; soldFrom: StockLocation }[],
  note?: string | null,
) {
  for (const item of items) {
    await recordInventoryMovement(
      {
        companyId,
        createdById: userId ?? null,
        input: {
          variantId: item.variantId,
          movementType: "SALE",
          location: item.soldFrom,
          quantity: item.quantity, // engine applies the negative delta
          salesOrderItemId: item.id,
          note: note?.trim() || undefined,
        },
      },
      tx,
    );
  }
}

// ── Queries ────────────────────────────────────────────────────────────────
export async function listSalesOrders(companyId: string) {
  const orders = await prisma.salesOrder.findMany({
    where: { companyId },
    include: SO_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(mapSalesOrder);
}

export async function getSalesOrder(companyId: string, id: string) {
  const so = await prisma.salesOrder.findFirst({
    where: { id, companyId },
    include: SO_INCLUDE,
  });
  return so ? mapSalesOrder(so) : null;
}

// ── Create ───────────────────────────────────────────────────────────────--
export async function createSalesOrder(args: {
  companyId: string;
  userId?: string | null;
  input: SalesOrderInput;
}): Promise<SalesOrderDTO> {
  const parsed = salesOrderSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new SalesError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, userId } = args;
  const location = data.location;

  const variantsMap = await loadCompanyVariants(
    companyId,
    data.items.map((i) => i.variantId),
  );
  const { items, totalAmount } = priceItems(data);
  const completed = !data.isDraft;

  // For a completed sale, verify stock before opening the transaction.
  if (completed) assertStockAvailable(variantsMap, items, location);

  const so = await prisma.$transaction(async (tx) => {
    const invoiceNo = await generateInvoiceNo(tx, companyId);
    const created = await tx.salesOrder.create({
      data: {
        companyId,
        invoiceNo,
        createdById: userId ?? null,
        status: completed ? SalesOrderStatus.COMPLETED : SalesOrderStatus.DRAFT,
        totalAmount,
        note: data.note?.trim() || null,
        items: {
          create: items.map((i) => ({
            companyId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            soldFrom: location,
          })),
        },
      },
      include: { items: { select: { id: true, variantId: true, quantity: true, soldFrom: true } } },
    });

    if (completed) {
      await applySaleMovements(tx, companyId, userId, created.items, data.note);
    }

    return tx.salesOrder.findUniqueOrThrow({
      where: { id: created.id },
      include: SO_INCLUDE,
    });
  });

  return mapSalesOrder(so);
}

// ── Update a DRAFT (no stock has moved yet) ────────────────────────────────
export async function updateSalesOrder(args: {
  companyId: string;
  id: string;
  input: SalesOrderInput;
}): Promise<SalesOrderDTO> {
  const parsed = salesOrderSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new SalesError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, id } = args;

  const existing = await prisma.salesOrder.findFirst({
    where: { id, companyId },
    select: { id: true, status: true },
  });
  if (!existing) throw new SalesError("Sales order not found", 404);
  if (existing.status !== SalesOrderStatus.DRAFT) {
    throw new SalesError("Only draft invoices can be edited", 409);
  }

  await loadCompanyVariants(companyId, data.items.map((i) => i.variantId));
  const { items, totalAmount } = priceItems(data);

  const so = await prisma.$transaction(async (tx) => {
    await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
    return tx.salesOrder.update({
      where: { id },
      data: {
        totalAmount,
        note: data.note?.trim() || null,
        items: {
          create: items.map((i) => ({
            companyId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            soldFrom: data.location,
          })),
        },
      },
      include: SO_INCLUDE,
    });
  });

  return mapSalesOrder(so);
}

// ── Complete a DRAFT → reduces stock now ───────────────────────────────────
export async function completeSalesOrder(args: {
  companyId: string;
  userId?: string | null;
  id: string;
}): Promise<SalesOrderDTO> {
  const { companyId, userId, id } = args;
  const existing = await prisma.salesOrder.findFirst({
    where: { id, companyId },
    include: { items: { select: { id: true, variantId: true, quantity: true, soldFrom: true } } },
  });
  if (!existing) throw new SalesError("Sales order not found", 404);
  if (existing.status !== SalesOrderStatus.DRAFT) {
    throw new SalesError("Only draft invoices can be completed", 409);
  }

  const variantsMap = await loadCompanyVariants(
    companyId,
    existing.items.map((i) => i.variantId),
  );
  // All items on an order share one location; check each against its own.
  for (const item of existing.items) {
    assertStockAvailable(variantsMap, [{ ...item, unitPrice: 0, totalPrice: 0 }], item.soldFrom);
  }

  const so = await prisma.$transaction(async (tx) => {
    await applySaleMovements(tx, companyId, userId, existing.items, existing.note);
    return tx.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.COMPLETED },
      include: SO_INCLUDE,
    });
  });

  return mapSalesOrder(so);
}

// ── Cancel (restores stock if the sale was completed) ──────────────────────
export async function cancelSalesOrder(args: {
  companyId: string;
  userId?: string | null;
  id: string;
}): Promise<SalesOrderDTO> {
  const { companyId, userId, id } = args;
  const existing = await prisma.salesOrder.findFirst({
    where: { id, companyId },
    include: { items: { select: { id: true, variantId: true, quantity: true, soldFrom: true } } },
  });
  if (!existing) throw new SalesError("Sales order not found", 404);
  if (
    existing.status === SalesOrderStatus.CANCELLED ||
    existing.status === SalesOrderStatus.RETURNED
  ) {
    throw new SalesError("This invoice can't be cancelled", 409);
  }

  const wasCompleted = existing.status === SalesOrderStatus.COMPLETED;

  const so = await prisma.$transaction(async (tx) => {
    if (wasCompleted) {
      // Put the sold units back via SALES_RETURN movements (the engine adds stock).
      for (const item of existing.items) {
        await recordInventoryMovement(
          {
            companyId,
            createdById: userId ?? null,
            input: {
              variantId: item.variantId,
              movementType: "SALES_RETURN",
              location: item.soldFrom,
              quantity: item.quantity,
              salesOrderItemId: item.id,
              note: `Invoice ${existing.invoiceNo} cancelled`,
            },
          },
          tx,
        );
      }
    }
    return tx.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.CANCELLED },
      include: SO_INCLUDE,
    });
  });

  return mapSalesOrder(so);
}

// ── Delete a DRAFT (no movements exist) ────────────────────────────────────
export async function deleteSalesOrder(args: {
  companyId: string;
  id: string;
}): Promise<{ id: string }> {
  const { companyId, id } = args;
  const existing = await prisma.salesOrder.findFirst({
    where: { id, companyId },
    select: { id: true, status: true },
  });
  if (!existing) throw new SalesError("Sales order not found", 404);
  if (existing.status !== SalesOrderStatus.DRAFT) {
    throw new SalesError(
      "Only draft invoices can be deleted; cancel a completed invoice instead.",
      409,
    );
  }

  await prisma.salesOrder.delete({ where: { id } });
  return { id };
}
