import { InventoryMovementType } from "@prisma/client";

// Direction of a movement relative to stock on hand:
//   in     → increases stock (delta is positive)
//   out    → decreases stock (delta is negative)
//   manual → caller supplies a signed delta (ADJUSTMENT can go either way)
export type MovementDirection = "in" | "out" | "manual";

export interface MovementTypeMeta {
  label: string;
  direction: MovementDirection;
}

// Single source of truth for how each movement type affects stock + its label.
// Reused by the engine (to compute the signed delta) and by any future history UI.
export const MOVEMENT_TYPE_META: Record<InventoryMovementType, MovementTypeMeta> = {
  PURCHASE: { label: "Purchase", direction: "in" },
  SALE: { label: "Sale", direction: "out" },
  TRANSFER_IN: { label: "Transfer In", direction: "in" },
  TRANSFER_OUT: { label: "Transfer Out", direction: "out" },
  // Returning purchased goods to the supplier reduces our stock.
  PURCHASE_RETURN: { label: "Purchase Return", direction: "out" },
  // A customer returning sold goods increases our stock.
  SALES_RETURN: { label: "Sales Return", direction: "in" },
  // Manual correction — the caller passes a signed quantity (+/-).
  ADJUSTMENT: { label: "Adjustment", direction: "manual" },
};

export function movementTypeLabel(type: InventoryMovementType): string {
  return MOVEMENT_TYPE_META[type].label;
}

/**
 * Convert a movement's input quantity into the signed delta applied to stock.
 * Directional types ignore the input sign (magnitude only); ADJUSTMENT keeps
 * the caller's sign so a correction can add or remove units.
 */
export function signedDelta(
  type: InventoryMovementType,
  quantity: number,
): number {
  const { direction } = MOVEMENT_TYPE_META[type];
  if (direction === "in") return Math.abs(quantity);
  if (direction === "out") return -Math.abs(quantity);
  return quantity; // manual
}
