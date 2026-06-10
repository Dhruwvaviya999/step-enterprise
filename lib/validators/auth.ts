import { z } from "zod";

// ── Company user login ─────────────────────────────────────────────────────
// User picks a company, then enters username OR email + password.
export const companyLoginSchema = z.object({
  companyId: z.string().min(1, "Select your company"),
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Password is required"),
});

// ── Super Admin login ──────────────────────────────────────────────────────
// No company. Username OR email + password.
export const superAdminLoginSchema = z.object({
  identifier: z.string().min(1, "Enter your username or email"),
  password: z.string().min(1, "Password is required"),
});

// ── Forgot password ────────────────────────────────────────────────────────
// Email is globally unique, so it's enough on its own to locate the account.
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type CompanyLoginInput = z.infer<typeof companyLoginSchema>;
export type SuperAdminLoginInput = z.infer<typeof superAdminLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
