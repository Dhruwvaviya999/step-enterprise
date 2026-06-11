import { SalesOrderStatus, StockLocation } from "@prisma/client";

export interface SalesItemRow {
  id: string;
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  soldFrom: StockLocation;
}

export interface SalesOrderRow {
  id: string;
  invoiceNo: string;
  status: SalesOrderStatus;
  soldAt: string;
  note: string | null;
  totalAmount: number;
  createdByName: string | null;
  items: SalesItemRow[];
}

export interface VariantOption {
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  sellingPrice: number;
  shopQty: number;
  godownQty: number;
  label: string;
}

// ── Status presentation (readable in light + dark) ─────────────────────────
export const SO_STATUS_META: Record<
  SalesOrderStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  RETURNED: {
    label: "Returned",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

// ── Derived helpers ────────────────────────────────────────────────────────
export const totalUnits = (so: SalesOrderRow) =>
  so.items.reduce((s, i) => s + i.quantity, 0);

export const isDraft = (so: SalesOrderRow) => so.status === "DRAFT";
export const isCompleted = (so: SalesOrderRow) => so.status === "COMPLETED";
export const isCancelable = (so: SalesOrderRow) =>
  so.status === "DRAFT" || so.status === "COMPLETED";

export function variantAvailable(v: VariantOption, location: StockLocation) {
  return location === StockLocation.SHOP ? v.shopQty : v.godownQty;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
export const formatMoney = (n: number) => inr.format(n);

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
