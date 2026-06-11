import { z } from "zod";
import { InventoryMovementType, StockLocation } from "@prisma/client";

// ── Inventory movement input ───────────────────────────────────────────────
// The business payload for a single stock change. companyId and createdById are
// NOT part of this schema — they come from the trusted session/caller, never
// the request body, so they can't be spoofed.
//
// `quantity` is the input magnitude (or a signed delta for ADJUSTMENT). The
// engine converts it into the signed delta actually written to the ledger.
export const inventoryMovementSchema = z
  .object({
    variantId: z.string().min(1, "Variant is required"),
    movementType: z.nativeEnum(InventoryMovementType),
    location: z.nativeEnum(StockLocation),
    quantity: z.coerce
      .number()
      .int("Use whole units only")
      .min(-1_000_000)
      .max(1_000_000),
    note: z.string().trim().max(255, "Note is too long").optional(),
    // Optional links back to the document that caused this movement. Future
    // modules (PO receive, sales, transfer) set the relevant one.
    purchaseOrderItemId: z.string().optional(),
    salesOrderItemId: z.string().optional(),
    stockTransferId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.quantity === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Quantity cannot be zero",
      });
    }
    // Only ADJUSTMENT may carry a negative quantity; every other type encodes
    // direction through its movement type, so its magnitude must be positive.
    if (val.movementType !== "ADJUSTMENT" && val.quantity < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantity"],
        message: "Quantity must be positive for this movement type",
      });
    }
  });

export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
