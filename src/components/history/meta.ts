import { InventoryMovementType } from "@prisma/client";

// Per-type badge styling (readable in light + dark).
export const MOVEMENT_BADGE: Record<InventoryMovementType, string> = {
  PURCHASE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  SALE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  TRANSFER_IN: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  TRANSFER_OUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  ADJUSTMENT: "bg-muted text-muted-foreground border-transparent",
  PURCHASE_RETURN: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  SALES_RETURN: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
};

export const MOVEMENT_TYPE_OPTIONS: { value: InventoryMovementType; label: string }[] = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "SALE", label: "Sale" },
  { value: "TRANSFER_IN", label: "Transfer In" },
  { value: "TRANSFER_OUT", label: "Transfer Out" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "PURCHASE_RETURN", label: "Purchase Return" },
  { value: "SALES_RETURN", label: "Sales Return" },
];

const numFmt = new Intl.NumberFormat("en-IN");
export const formatNumber = (n: number) => numFmt.format(n);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
