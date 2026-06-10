import { z } from "zod";

// ── Register company (Super Admin only) ────────────────────────────────────
// Creates a Company together with its first ADMIN user so the company can log
// in immediately. The company `code` is auto-generated server-side.
export const registerCompanySchema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name is too long"),
  adminName: z
    .string()
    .min(2, "Admin name must be at least 2 characters")
    .max(100, "Name is too long"),
  adminEmail: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

// ── Update company settings (company ADMIN only) ───────────────────────────
// The company `code` is intentionally NOT part of this schema — it is a stable,
// unique identifier shown read-only and never edited from settings. Optional
// text fields accept "" from the form; the API normalises blanks to null.
//
// `logoUrl` may be either an existing Cloudinary URL (unchanged) or a base64
// data URI for a freshly picked image, which the API uploads server-side.
export const updateCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .or(z.literal("")),
  phone: z.string().trim().max(20, "Phone number is too long").optional(),
  address: z.string().trim().max(255, "Address is too long").optional(),
  city: z.string().trim().max(100, "City is too long").optional(),
  state: z.string().trim().max(100, "State is too long").optional(),
  country: z.string().trim().max(100, "Country is too long").optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
