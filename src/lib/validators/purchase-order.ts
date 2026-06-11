import { z } from "zod";
import { StockLocation } from "@prisma/client";

const MAX_PRICE = 99_999_999.99;
const MAX_QTY = 1_000_000;

// ── A single ordered line ──────────────────────────────────────────────────
export const poItemSchema = z.object({
  variantId: z.string().min(1, "Select a variant"),
  orderedQty: z.coerce
    .number()
    .int("Whole units only")
    .min(1, "Quantity must be at least 1")
    .max(MAX_QTY),
  unitPurchasePrice: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(MAX_PRICE, "Price is too large"),
});

// ── Create / update a purchase order ───────────────────────────────────────
// supplierId + variantIds are re-validated against the company server-side.
// isDraft decides the initial status (DRAFT vs PENDING). expectedDate is an
// optional "YYYY-MM-DD" string the action converts to a Date.
export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  expectedDate: z.string().optional(),
  note: z.string().trim().max(255, "Note is too long").optional(),
  isDraft: z.boolean().default(false),
  items: z
    .array(poItemSchema)
    .min(1, "Add at least one item")
    .max(200, "Too many items"),
});

// ── Receive stock against a purchase order ─────────────────────────────────
// location is where the received units land (SHOP/GODOWN). Per-line receiveQty
// is capped against the line's pending quantity in the action (not in Zod).
export const receiveStockSchema = z.object({
  location: z.nativeEnum(StockLocation),
  note: z.string().trim().max(255, "Note is too long").optional(),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1),
        receiveQty: z.coerce.number().int("Whole units only").min(0).max(MAX_QTY),
      }),
    )
    .min(1, "Nothing to receive"),
});

export type PoItemInput = z.infer<typeof poItemSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
