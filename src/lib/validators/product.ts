import { z } from "zod";

// ── Variant ────────────────────────────────────────────────────────────────
// Stock lives on the variant: shopQty + godownQty are the two stock locations
// (SHOP / GODOWN). minStock is the per-variant low-stock threshold used later
// for alerts. Size is stored as a free string per the project rules.
export const SIZE_TYPES = ["BIG", "SMALL"] as const;

export const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(20, "Size is too long"),
  color: z
    .string()
    .trim()
    .min(1, "Color is required")
    .max(30, "Color is too long"),
  // Size category. Same size + color may exist as both BIG and SMALL, so it is
  // part of the variant's identity (see @@unique in schema.prisma).
  sizeType: z.enum(SIZE_TYPES).default("BIG"),
  shopQty: z.coerce.number().int("Whole numbers only").min(0).max(1_000_000),
  godownQty: z.coerce.number().int("Whole numbers only").min(0).max(1_000_000),
  minStock: z.coerce.number().int("Whole numbers only").min(0).max(1_000_000),
});

export type VariantInput = z.infer<typeof variantSchema>;

// ── Product base (shared by create + update) ───────────────────────────────
// brandId is optional ("" → no brand). categoryId is required. Prices map to
// Decimal(10,2); we cap at the column max and keep them non-negative.
const MAX_PRICE = 99_999_999.99;

export const productBaseSchema = z.object({
  articleNo: z
    .string()
    .trim()
    .min(1, "Article number is required")
    .max(50, "Article number is too long"),
  articleName: z
    .string()
    .trim()
    .min(1, "Article name is required")
    .max(100, "Article name is too long"),
  brandId: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  sellingPrice: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(MAX_PRICE, "Price is too large"),
  defaultPurchasePrice: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(MAX_PRICE, "Price is too large"),
  isActive: z.boolean().default(true),
});

// Create requires at least one variant; variants are then managed individually.
export const createProductSchema = productBaseSchema.extend({
  variants: z
    .array(variantSchema)
    .min(1, "Add at least one variant")
    .max(100, "Too many variants"),
});

// Update edits product fields only — variants have their own endpoints.
export const updateProductSchema = productBaseSchema;

export type ProductBaseInput = z.infer<typeof productBaseSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
