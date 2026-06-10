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
