import { eachDayOfInterval, format } from "date-fns";

import { prisma } from "@/lib/prisma";
import type { DateWindow } from "./date-range";

// ── Report DTOs (plain JSON — safe to hand to client components) ────────────
export interface NamedQty {
  name: string;
  qty: number;
}
export interface NamedSale {
  name: string;
  qty: number;
  amount: number;
}
export interface TrendPoint {
  date: string; // "MMM d" label
  qty: number;
  amount: number;
}

export interface StockReport {
  totalProducts: number;
  totalVariants: number;
  totalShopQty: number;
  totalGodownQty: number;
  totalQty: number;
  byBrand: NamedQty[];
  byCategory: NamedQty[];
  byProduct: { name: string; articleNo: string; qty: number }[];
}

export interface LowStockRow {
  productName: string;
  articleNo: string;
  size: string;
  color: string;
  shopQty: number;
  godownQty: number;
  minStock: number;
  difference: number; // (shop + godown) - minStock  (<= 0 means at/below threshold)
}

export interface SalesReport {
  totalOrders: number;
  totalQty: number;
  totalAmount: number;
  topProducts: NamedSale[];
  topVariants: NamedSale[];
  trend: TrendPoint[];
}

export interface PurchaseReport {
  totalOrders: number;
  totalQty: number;
  totalAmount: number;
  bySupplier: NamedSale[];
  topProducts: NamedQty[];
  trend: TrendPoint[];
}

// Build an empty, zero-filled daily series so charts show a continuous axis.
function emptyTrend(window: DateWindow) {
  const days = eachDayOfInterval({ start: window.from, end: window.to });
  const order: string[] = [];
  const map = new Map<string, TrendPoint>();
  for (const d of days) {
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, "MMM d");
    order.push(key);
    map.set(key, { date: label, qty: 0, amount: 0 });
  }
  const add = (date: Date, qty: number, amount: number) => {
    const key = format(date, "yyyy-MM-dd");
    const point = map.get(key);
    if (point) {
      point.qty += qty;
      point.amount += amount;
    }
  };
  const series = () => order.map((k) => map.get(k)!);
  return { add, series };
}

function topN<T>(items: T[], by: (t: T) => number, n = 8): T[] {
  return [...items].sort((a, b) => by(b) - by(a)).slice(0, n);
}

// ── Stock + low-stock (current snapshot; not date-bound) ───────────────────
export async function getStockAndLowStock(
  companyId: string,
): Promise<{ stock: StockReport; lowStock: LowStockRow[] }> {
  const [totalProducts, variants] = await Promise.all([
    prisma.product.count({ where: { companyId } }),
    prisma.productVariant.findMany({
      where: { companyId },
      select: {
        size: true,
        color: true,
        shopQty: true,
        godownQty: true,
        minStock: true,
        product: {
          select: {
            articleNo: true,
            articleName: true,
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  let totalShopQty = 0;
  let totalGodownQty = 0;
  const brandMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const productMap = new Map<string, { name: string; articleNo: string; qty: number }>();
  const lowStock: LowStockRow[] = [];

  for (const v of variants) {
    const total = v.shopQty + v.godownQty;
    totalShopQty += v.shopQty;
    totalGodownQty += v.godownQty;

    const brand = v.product.brand?.name ?? "No brand";
    brandMap.set(brand, (brandMap.get(brand) ?? 0) + total);

    const category = v.product.category.name;
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + total);

    const pKey = v.product.articleNo;
    const existing = productMap.get(pKey);
    if (existing) existing.qty += total;
    else
      productMap.set(pKey, {
        name: v.product.articleName,
        articleNo: v.product.articleNo,
        qty: total,
      });

    if (total <= v.minStock) {
      lowStock.push({
        productName: v.product.articleName,
        articleNo: v.product.articleNo,
        size: v.size,
        color: v.color,
        shopQty: v.shopQty,
        godownQty: v.godownQty,
        minStock: v.minStock,
        difference: total - v.minStock,
      });
    }
  }

  const toNamedQty = (m: Map<string, number>): NamedQty[] =>
    [...m.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);

  const stock: StockReport = {
    totalProducts,
    totalVariants: variants.length,
    totalShopQty,
    totalGodownQty,
    totalQty: totalShopQty + totalGodownQty,
    byBrand: toNamedQty(brandMap),
    byCategory: toNamedQty(categoryMap),
    byProduct: [...productMap.values()].sort((a, b) => b.qty - a.qty),
  };

  lowStock.sort((a, b) => a.difference - b.difference);
  return { stock, lowStock };
}

// ── Sales (COMPLETED orders within the window, by sold date) ───────────────
export async function getSalesReport(
  companyId: string,
  window: DateWindow,
): Promise<SalesReport> {
  const orders = await prisma.salesOrder.findMany({
    where: {
      companyId,
      status: "COMPLETED",
      soldAt: { gte: window.from, lte: window.to },
    },
    select: {
      soldAt: true,
      totalAmount: true,
      items: {
        select: {
          quantity: true,
          totalPrice: true,
          variant: {
            select: {
              size: true,
              color: true,
              product: { select: { articleNo: true, articleName: true } },
            },
          },
        },
      },
    },
  });

  let totalQty = 0;
  let totalAmount = 0;
  const productMap = new Map<string, NamedSale>();
  const variantMap = new Map<string, NamedSale>();
  const trend = emptyTrend(window);

  for (const o of orders) {
    const amount = Number(o.totalAmount);
    totalAmount += amount;
    let orderQty = 0;

    for (const it of o.items) {
      orderQty += it.quantity;
      const linePrice = Number(it.totalPrice);
      const p = it.variant.product;

      const pEntry = productMap.get(p.articleNo) ?? {
        name: p.articleName,
        qty: 0,
        amount: 0,
      };
      pEntry.qty += it.quantity;
      pEntry.amount += linePrice;
      productMap.set(p.articleNo, pEntry);

      const vKey = `${p.articleNo} · ${it.variant.size}/${it.variant.color}`;
      const vEntry = variantMap.get(vKey) ?? { name: vKey, qty: 0, amount: 0 };
      vEntry.qty += it.quantity;
      vEntry.amount += linePrice;
      variantMap.set(vKey, vEntry);
    }

    totalQty += orderQty;
    trend.add(o.soldAt, orderQty, amount);
  }

  return {
    totalOrders: orders.length,
    totalQty,
    totalAmount,
    topProducts: topN([...productMap.values()], (x) => x.qty),
    topVariants: topN([...variantMap.values()], (x) => x.qty),
    trend: trend.series(),
  };
}

// ── Purchases (PURCHASE movements within the window, by receipt date) ──────
// Receipt-based so trends use real dates; links back to product + supplier via
// the originating purchase order item.
export async function getPurchaseReport(
  companyId: string,
  window: DateWindow,
): Promise<PurchaseReport> {
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      companyId,
      movementType: "PURCHASE",
      createdAt: { gte: window.from, lte: window.to },
    },
    select: {
      quantity: true,
      createdAt: true,
      variant: {
        select: { product: { select: { articleNo: true, articleName: true } } },
      },
      purchaseOrderItem: {
        select: {
          unitPurchasePrice: true,
          purchaseOrder: { select: { id: true, supplier: { select: { name: true } } } },
        },
      },
    },
  });

  let totalQty = 0;
  let totalAmount = 0;
  const supplierMap = new Map<string, NamedSale>();
  const productMap = new Map<string, NamedQty>();
  const poIds = new Set<string>();
  const trend = emptyTrend(window);

  for (const m of movements) {
    const qty = m.quantity; // PURCHASE delta is positive
    const unit = m.purchaseOrderItem
      ? Number(m.purchaseOrderItem.unitPurchasePrice)
      : 0;
    const amount = qty * unit;
    totalQty += qty;
    totalAmount += amount;
    trend.add(m.createdAt, qty, amount);

    const po = m.purchaseOrderItem?.purchaseOrder;
    if (po) poIds.add(po.id);
    const supplier = po?.supplier?.name ?? "Manual / other";
    const sEntry = supplierMap.get(supplier) ?? { name: supplier, qty: 0, amount: 0 };
    sEntry.qty += qty;
    sEntry.amount += amount;
    supplierMap.set(supplier, sEntry);

    const p = m.variant.product;
    const pEntry = productMap.get(p.articleNo) ?? { name: p.articleName, qty: 0 };
    pEntry.qty += qty;
    productMap.set(p.articleNo, pEntry);
  }

  return {
    totalOrders: poIds.size,
    totalQty,
    totalAmount,
    bySupplier: topN([...supplierMap.values()], (x) => x.amount),
    topProducts: topN([...productMap.values()], (x) => x.qty),
    trend: trend.series(),
  };
}
