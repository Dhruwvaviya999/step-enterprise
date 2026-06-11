import { z } from "zod";
import { StockLocation } from "@prisma/client";

const MAX_PRICE = 99_999_999.99;
const MAX_QTY = 1_000_000;

// ── A single sold line ─────────────────────────────────────────────────────
// totalPrice is derived server-side (quantity × unitPrice), never trusted from
// the client.
export const salesItemSchema = z.object({
  variantId: z.string().min(1, "Select a variant"),
  quantity: z.coerce
    .number()
    .int("Whole units only")
    .min(1, "Quantity must be at least 1")
    .max(MAX_QTY),
  unitPrice: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(MAX_PRICE, "Price is too large"),
});

// ── Create / update a sales order (invoice) ────────────────────────────────
// location is where stock is sold FROM (SHOP by default). isDraft decides the
// initial status (DRAFT = no stock impact, COMPLETED = reduces stock now).
export const salesOrderSchema = z.object({
  location: z.nativeEnum(StockLocation).default(StockLocation.SHOP),
  note: z.string().trim().max(255, "Note is too long").optional(),
  isDraft: z.boolean().default(false),
  items: z
    .array(salesItemSchema)
    .min(1, "Add at least one item")
    .max(200, "Too many items"),
});

export type SalesItemInput = z.infer<typeof salesItemSchema>;
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;
