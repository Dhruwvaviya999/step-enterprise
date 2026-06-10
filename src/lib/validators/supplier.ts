import { z } from "zod";

// ── Supplier create / update (company users) ───────────────────────────────
// companyId comes from the session, never the client. `name` is unique per
// company (@@unique([companyId, name])) and that violation is mapped to a 409
// by the API. Optional contact fields accept "" from the form; the API
// normalises blanks to null before saving.
export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Supplier name is required")
    .max(100, "Supplier name is too long"),
  phone: z.string().trim().max(20, "Phone number is too long").optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .or(z.literal("")),
  address: z.string().trim().max(255, "Address is too long").optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
