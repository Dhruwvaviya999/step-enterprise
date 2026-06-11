// Shared UI types for the product module. Prices are plain numbers here
// (Prisma Decimal is converted at the SSR/API boundary) so the client never
// has to deal with Decimal objects.

export interface VariantRow {
  id: string;
  size: string;
  color: string;
  shopQty: number;
  godownQty: number;
  minStock: number;
}

export interface ProductRow {
  id: string;
  articleNo: string;
  articleName: string;
  brandId: string | null;
  brandName: string | null;
  categoryId: string;
  categoryName: string;
  sellingPrice: number;
  defaultPurchasePrice: number;
  isActive: boolean;
  variants: VariantRow[];
}

/** Lightweight option used by the brand/category dropdowns and filters. */
export interface Option {
  id: string;
  name: string;
}

// ── Derived helpers (kept here so table, filter and manager agree) ─────────

/** Total units across both stock locations for one variant. */
export function variantTotal(v: VariantRow): number {
  return v.shopQty + v.godownQty;
}

/** Total stock for a product across all variants. */
export function productTotalStock(p: ProductRow): number {
  return p.variants.reduce((sum, v) => sum + variantTotal(v), 0);
}

/** A product is "low stock" if any variant is at or below its threshold. */
export function isLowStock(p: ProductRow): boolean {
  return p.variants.some((v) => variantTotal(v) <= v.minStock);
}
