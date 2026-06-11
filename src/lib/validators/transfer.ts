import { z } from "zod";
import { StockLocation } from "@prisma/client";

// ── Create a stock transfer ────────────────────────────────────────────────
// Moves one variant's stock between the only two locations (SHOP / GODOWN).
// companyId + transferredBy come from the session, never the body. The
// superRefine enforces that the two locations differ, ruling out SHOP→SHOP and
// GODOWN→GODOWN. Stock availability is checked in the action (needs the DB).
export const transferSchema = z
  .object({
    variantId: z.string().min(1, "Select a variant"),
    fromLocation: z.nativeEnum(StockLocation),
    toLocation: z.nativeEnum(StockLocation),
    quantity: z.coerce
      .number()
      .int("Whole units only")
      .min(1, "Quantity must be at least 1")
      .max(1_000_000),
    note: z.string().trim().max(255, "Note is too long").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.fromLocation === val.toLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toLocation"],
        message: "From and To must be different locations",
      });
    }
  });

export type TransferInput = z.infer<typeof transferSchema>;
