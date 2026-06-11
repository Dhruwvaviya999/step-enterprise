import { StockLocation } from "@prisma/client";

export interface TransferRow {
  id: string;
  transferNo: string;
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  fromLocation: StockLocation;
  toLocation: StockLocation;
  quantity: number;
  note: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface VariantOption {
  variantId: string;
  articleNo: string;
  articleName: string;
  size: string;
  color: string;
  shopQty: number;
  godownQty: number;
  label: string;
}

export const locationLabel = (loc: StockLocation) =>
  loc === StockLocation.SHOP ? "Shop" : "Godown";

export function variantAvailable(v: VariantOption, location: StockLocation) {
  return location === StockLocation.SHOP ? v.shopQty : v.godownQty;
}

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
