import {
  Prisma,
  PurchaseOrderStatus,
  type StockLocation,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  purchaseOrderSchema,
  receiveStockSchema,
  type PurchaseOrderInput,
  type ReceiveStockInput,
} from "@/lib/validators/purchase-order";
import { recordInventoryMovement } from "@/lib/actions/inventory-movement";

// Business-rule failures (not-found, not editable, over-receive, …). Routes map
// `statusCode` to an HTTP response.
export class POError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "POError";
  }
}

// ── Shared shape + mapper ──────────────────────────────────────────────────
const PO_INCLUDE = {
  supplier: { select: { id: true, name: true } },
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
} satisfies Prisma.PurchaseOrderInclude;

type PoWithRelations = Prisma.PurchaseOrderGetPayload<{ include: typeof PO_INCLUDE }>;

// Flatten + convert Decimals/Dates to client-friendly numbers/ISO strings.
export function mapPurchaseOrder(po: PoWithRelations) {
  return {
    id: po.id,
    orderNo: po.orderNo,
    status: po.status,
    supplierId: po.supplierId,
    supplierName: po.supplier.name,
    orderDate: po.orderDate.toISOString(),
    expectedDate: po.expectedDate?.toISOString() ?? null,
    note: po.note,
    totalAmount: Number(po.totalAmount),
    items: po.items.map((it) => ({
      id: it.id,
      variantId: it.variantId,
      articleNo: it.variant.product.articleNo,
      articleName: it.variant.product.articleName,
      size: it.variant.size,
      color: it.variant.color,
      orderedQty: it.orderedQty,
      receivedQty: it.receivedQty,
      unitPurchasePrice: Number(it.unitPurchasePrice),
    })),
  };
}

export type PurchaseOrderDTO = ReturnType<typeof mapPurchaseOrder>;

// ── Helpers ────────────────────────────────────────────────────────────────

// Sequential, company-scoped PO number (PO-0001). Generated inside the create
// transaction; retries on the off chance of a collision.
async function generatePurchaseOrderNo(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<string> {
  const count = await tx.purchaseOrder.count({ where: { companyId } });
  for (let i = 1; i <= 50; i++) {
    const orderNo = `PO-${String(count + i).padStart(4, "0")}`;
    const clash = await tx.purchaseOrder.findFirst({
      where: { companyId, orderNo },
      select: { id: true },
    });
    if (!clash) return orderNo;
  }
  throw new POError("Could not generate a purchase order number", 500);
}

function parseExpectedDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new POError("Invalid expected date", 400);
  return d;
}

// Ensure the supplier and every variant belong to THIS company. Returns the
// computed order total so callers don't repeat the math.
async function validateRefsAndTotal(
  companyId: string,
  data: PurchaseOrderInput,
): Promise<number> {
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, companyId },
    select: { id: true },
  });
  if (!supplier) throw new POError("Selected supplier is invalid", 400);

  const variantIds = [...new Set(data.items.map((i) => i.variantId))];
  const found = await prisma.productVariant.count({
    where: { id: { in: variantIds }, companyId },
  });
  if (found !== variantIds.length) {
    throw new POError("One or more selected variants are invalid", 400);
  }

  return data.items.reduce(
    (sum, i) => sum + i.orderedQty * i.unitPurchasePrice,
    0,
  );
}

const totalReceived = (items: { receivedQty: number }[]) =>
  items.reduce((s, i) => s + i.receivedQty, 0);

// ── Queries ────────────────────────────────────────────────────────────────
export async function listPurchaseOrders(companyId: string) {
  const orders = await prisma.purchaseOrder.findMany({
    where: { companyId },
    include: PO_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return orders.map(mapPurchaseOrder);
}

export async function getPurchaseOrder(companyId: string, id: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: PO_INCLUDE,
  });
  return po ? mapPurchaseOrder(po) : null;
}

// ── Create ───────────────────────────────────────────────────────────────--
export async function createPurchaseOrder(args: {
  companyId: string;
  userId?: string | null;
  input: PurchaseOrderInput;
}): Promise<PurchaseOrderDTO> {
  const parsed = purchaseOrderSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new POError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId } = args;

  const totalAmount = await validateRefsAndTotal(companyId, data);
  const expectedDate = parseExpectedDate(data.expectedDate);
  const status = data.isDraft
    ? PurchaseOrderStatus.DRAFT
    : PurchaseOrderStatus.PENDING;

  const po = await prisma.$transaction(async (tx) => {
    const orderNo = await generatePurchaseOrderNo(tx, companyId);
    return tx.purchaseOrder.create({
      data: {
        companyId,
        orderNo,
        supplierId: data.supplierId,
        createdById: args.userId ?? null,
        expectedDate,
        status,
        totalAmount,
        note: data.note?.trim() || null,
        items: {
          create: data.items.map((i) => ({
            companyId,
            variantId: i.variantId,
            orderedQty: i.orderedQty,
            unitPurchasePrice: i.unitPurchasePrice,
          })),
        },
      },
      include: PO_INCLUDE,
    });
  });

  return mapPurchaseOrder(po);
}

// ── Update (only before any stock is received) ─────────────────────────────
export async function updatePurchaseOrder(args: {
  companyId: string;
  id: string;
  input: PurchaseOrderInput;
}): Promise<PurchaseOrderDTO> {
  const parsed = purchaseOrderSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new POError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, id } = args;

  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: { items: { select: { receivedQty: true } } },
  });
  if (!existing) throw new POError("Purchase order not found", 404);

  const editable =
    (existing.status === PurchaseOrderStatus.DRAFT ||
      existing.status === PurchaseOrderStatus.PENDING) &&
    totalReceived(existing.items) === 0;
  if (!editable) {
    throw new POError("This purchase order can no longer be edited", 409);
  }

  const totalAmount = await validateRefsAndTotal(companyId, data);
  const expectedDate = parseExpectedDate(data.expectedDate);
  const status = data.isDraft
    ? PurchaseOrderStatus.DRAFT
    : PurchaseOrderStatus.PENDING;

  // No receipts yet → safe to replace the item set wholesale.
  const po = await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        expectedDate,
        status,
        totalAmount,
        note: data.note?.trim() || null,
        items: {
          create: data.items.map((i) => ({
            companyId,
            variantId: i.variantId,
            orderedQty: i.orderedQty,
            unitPurchasePrice: i.unitPurchasePrice,
          })),
        },
      },
      include: PO_INCLUDE,
    });
  });

  return mapPurchaseOrder(po);
}

// ── Cancel (soft; keeps any stock already received) ────────────────────────
export async function cancelPurchaseOrder(args: {
  companyId: string;
  id: string;
}): Promise<PurchaseOrderDTO> {
  const { companyId, id } = args;
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    select: { id: true, status: true },
  });
  if (!existing) throw new POError("Purchase order not found", 404);

  const cancelable =
    existing.status === PurchaseOrderStatus.DRAFT ||
    existing.status === PurchaseOrderStatus.PENDING ||
    existing.status === PurchaseOrderStatus.PARTIAL;
  if (!cancelable) {
    throw new POError("This purchase order can't be cancelled", 409);
  }

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: PurchaseOrderStatus.CANCELLED },
    include: PO_INCLUDE,
  });
  return mapPurchaseOrder(po);
}

// ── Delete (only if nothing has been received) ─────────────────────────────
export async function deletePurchaseOrder(args: {
  companyId: string;
  id: string;
}): Promise<{ id: string }> {
  const { companyId, id } = args;
  const existing = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: { items: { select: { receivedQty: true } } },
  });
  if (!existing) throw new POError("Purchase order not found", 404);

  if (totalReceived(existing.items) > 0) {
    throw new POError(
      "This purchase order has received stock and can't be deleted; cancel it instead.",
      409,
    );
  }

  // Items cascade with the order (onDelete: Cascade), no movements exist yet.
  await prisma.purchaseOrder.delete({ where: { id } });
  return { id };
}

// ── Receive stock (creates InventoryMovements via the Step 8 engine) ───────
export async function receivePurchaseOrderStock(args: {
  companyId: string;
  userId?: string | null;
  id: string;
  input: ReceiveStockInput;
}): Promise<PurchaseOrderDTO> {
  const parsed = receiveStockSchema.safeParse(args.input);
  if (!parsed.success) {
    throw new POError(parsed.error.issues[0]?.message ?? "Invalid data", 422);
  }
  const data = parsed.data;
  const { companyId, userId, id } = args;
  const location = data.location as StockLocation;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, companyId },
    include: { items: true },
  });
  if (!po) throw new POError("Purchase order not found", 404);

  if (
    po.status !== PurchaseOrderStatus.PENDING &&
    po.status !== PurchaseOrderStatus.PARTIAL
  ) {
    throw new POError("This purchase order can't receive stock", 409);
  }

  // Validate every line against its pending quantity.
  const receipts: { itemId: string; variantId: string; qty: number }[] = [];
  for (const line of data.lines) {
    const item = po.items.find((it) => it.id === line.itemId);
    if (!item) throw new POError("Invalid purchase order item", 400);
    const pending = item.orderedQty - item.receivedQty;
    if (line.receiveQty > pending) {
      throw new POError(
        `Cannot receive more than the pending quantity (${pending})`,
        400,
      );
    }
    if (line.receiveQty > 0) {
      receipts.push({ itemId: item.id, variantId: item.variantId, qty: line.receiveQty });
    }
  }
  if (receipts.length === 0) {
    throw new POError("Enter a quantity to receive", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const r of receipts) {
      await tx.purchaseOrderItem.update({
        where: { id: r.itemId },
        data: { receivedQty: { increment: r.qty } },
      });
      // Stock change goes through the Step 8 engine (same transaction) so the
      // variant qty + the inventory ledger update atomically.
      await recordInventoryMovement(
        {
          companyId,
          createdById: userId ?? null,
          input: {
            variantId: r.variantId,
            movementType: "PURCHASE",
            location,
            quantity: r.qty,
            purchaseOrderItemId: r.itemId,
            note: data.note?.trim() || undefined,
          },
        },
        tx,
      );
    }

    // Recompute status from the fresh received quantities.
    const items = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
      select: { orderedQty: true, receivedQty: true },
    });
    const allReceived = items.every((it) => it.receivedQty >= it.orderedQty);
    const status = allReceived
      ? PurchaseOrderStatus.RECEIVED
      : PurchaseOrderStatus.PARTIAL;

    return tx.purchaseOrder.update({
      where: { id },
      data: { status },
      include: PO_INCLUDE,
    });
  });

  return mapPurchaseOrder(updated);
}
