import { Prisma, type InventoryMovementType, type StockLocation } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { MOVEMENT_TYPE_META, movementTypeLabel } from "@/lib/constants/movement-types";
import {
  historyParamsSchema,
  resolveHistoryWindow,
} from "@/lib/validators/inventory-history";

// InventoryMovement is the single source of truth for stock history — this
// module only READS it (the write engine lives in inventory-movement.ts).

export const HISTORY_PAGE_SIZE = 25;

export interface HistoryFilter {
  companyId: string;
  type?: InventoryMovementType;
  location?: StockLocation;
  productId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  page: number;
}

// Normalise raw search params (from the page or the API) into one filter.
export function buildHistoryFilter(
  companyId: string,
  raw: Record<string, string | string[] | undefined>,
): HistoryFilter {
  const pick = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const parsed = historyParamsSchema.parse({
    type: pick(raw.type),
    location: pick(raw.location),
    productId: pick(raw.productId),
    q: pick(raw.q),
    range: pick(raw.range),
    from: pick(raw.from),
    to: pick(raw.to),
    page: pick(raw.page),
  });
  const window = resolveHistoryWindow(parsed);
  return {
    companyId,
    type: parsed.type,
    location: parsed.location,
    productId: parsed.productId,
    search: parsed.q,
    from: window.from,
    to: window.to,
    page: parsed.page,
  };
}

function buildWhere(filter: HistoryFilter): Prisma.InventoryMovementWhereInput {
  const { companyId, type, location, productId, search, from, to } = filter;
  const dateBound =
    from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {};
  const searchClause: Prisma.InventoryMovementWhereInput = search
    ? {
        OR: [
          { note: { contains: search, mode: "insensitive" } },
          { variant: { product: { articleName: { contains: search, mode: "insensitive" } } } },
          { variant: { product: { articleNo: { contains: search, mode: "insensitive" } } } },
          { variant: { size: { contains: search, mode: "insensitive" } } },
          { variant: { color: { contains: search, mode: "insensitive" } } },
          { purchaseOrderItem: { purchaseOrder: { orderNo: { contains: search, mode: "insensitive" } } } },
          { salesOrderItem: { salesOrder: { invoiceNo: { contains: search, mode: "insensitive" } } } },
          { stockTransfer: { transferNo: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  return {
    companyId,
    ...(type ? { movementType: type } : {}),
    ...(location ? { location } : {}),
    ...(productId ? { variant: { productId } } : {}),
    ...dateBound,
    ...searchClause,
  };
}

export interface HistoryItem {
  id: string;
  movementType: InventoryMovementType;
  movementLabel: string;
  direction: "in" | "out" | "manual";
  quantity: number; // signed delta
  location: StockLocation;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
  product: { articleNo: string; articleName: string };
  variant: { size: string; color: string; sizeType: "BIG" | "SMALL" };
  source: { type: string; ref: string | null };
}

export interface HistoryResult {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: { totalRecords: number; inUnits: number; outUnits: number; netUnits: number };
}

/** Fetch one page of movement history (newest first) plus in/out summary. */
export async function getInventoryHistory(filter: HistoryFilter): Promise<HistoryResult> {
  const where = buildWhere(filter);
  const pageSize = HISTORY_PAGE_SIZE;

  const [rows, total, inAgg, outAgg] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (filter.page - 1) * pageSize,
      select: {
        id: true,
        movementType: true,
        quantity: true,
        location: true,
        note: true,
        createdAt: true,
        createdBy: { select: { name: true, username: true } },
        variant: {
          select: {
            size: true,
            color: true,
            sizeType: true,
            product: { select: { articleNo: true, articleName: true } },
          },
        },
        purchaseOrderItem: { select: { purchaseOrder: { select: { orderNo: true } } } },
        salesOrderItem: { select: { salesOrder: { select: { invoiceNo: true } } } },
        stockTransfer: { select: { transferNo: true } },
      },
    }),
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.aggregate({
      where: { ...where, quantity: { gt: 0 } },
      _sum: { quantity: true },
    }),
    prisma.inventoryMovement.aggregate({
      where: { ...where, quantity: { lt: 0 } },
      _sum: { quantity: true },
    }),
  ]);

  const items: HistoryItem[] = rows.map((m) => {
    let source = { type: "Adjustment", ref: null as string | null };
    if (m.stockTransfer) source = { type: "Transfer", ref: m.stockTransfer.transferNo };
    else if (m.purchaseOrderItem)
      source = { type: "Purchase", ref: m.purchaseOrderItem.purchaseOrder.orderNo };
    else if (m.salesOrderItem)
      source = { type: "Sale", ref: m.salesOrderItem.salesOrder.invoiceNo };

    return {
      id: m.id,
      movementType: m.movementType,
      movementLabel: movementTypeLabel(m.movementType),
      direction: MOVEMENT_TYPE_META[m.movementType].direction,
      quantity: m.quantity,
      location: m.location,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
      createdBy: m.createdBy?.name ?? m.createdBy?.username ?? null,
      product: {
        articleNo: m.variant.product.articleNo,
        articleName: m.variant.product.articleName,
      },
      variant: {
        size: m.variant.size,
        color: m.variant.color,
        sizeType: m.variant.sizeType,
      },
      source,
    };
  });

  const inUnits = inAgg._sum.quantity ?? 0;
  const outUnits = Math.abs(outAgg._sum.quantity ?? 0);

  return {
    items,
    total,
    page: filter.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    summary: {
      totalRecords: total,
      inUnits,
      outUnits,
      netUnits: inUnits - outUnits,
    },
  };
}
