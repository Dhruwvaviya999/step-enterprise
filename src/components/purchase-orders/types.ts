import { PurchaseOrderStatus } from "@prisma/client";

export interface POItemRow {
  id: string;
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  orderedQty: number;
  receivedQty: number;
  unitPurchasePrice: number;
}

export interface PurchaseOrderRow {
  id: string;
  orderNo: string;
  status: PurchaseOrderStatus;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string | null;
  note: string | null;
  totalAmount: number;
  items: POItemRow[];
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface VariantOption {
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  defaultPurchasePrice: number;
  /** Pre-built display label, e.g. "CR-001 · Crocs Classic · 7 / Black". */
  label: string;
}

// ── Status presentation (tokens chosen to read well in light + dark) ───────
export const PO_STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  PARTIAL: {
    label: "Partial",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  RECEIVED: {
    label: "Received",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

// ── Derived helpers (shared so every component agrees) ─────────────────────
export const itemPending = (i: POItemRow) => i.orderedQty - i.receivedQty;

export const orderedTotal = (po: PurchaseOrderRow) =>
  po.items.reduce((s, i) => s + i.orderedQty, 0);

export const receivedTotal = (po: PurchaseOrderRow) =>
  po.items.reduce((s, i) => s + i.receivedQty, 0);

export const lineTotal = (i: POItemRow) => i.orderedQty * i.unitPurchasePrice;

/** Can stock still be received against this PO? */
export const isReceivable = (po: PurchaseOrderRow) =>
  po.status === "PENDING" || po.status === "PARTIAL";

/** Editable only before any stock is received. */
export const isEditable = (po: PurchaseOrderRow) =>
  (po.status === "DRAFT" || po.status === "PENDING") && receivedTotal(po) === 0;

export const isCancelable = (po: PurchaseOrderRow) =>
  po.status === "DRAFT" || po.status === "PENDING" || po.status === "PARTIAL";

export const isDeletable = (po: PurchaseOrderRow) => receivedTotal(po) === 0;

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
