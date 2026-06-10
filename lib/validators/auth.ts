import { z } from "zod";

// ── Company user login ─────────────────────────────────────────────────────
// A company user signs in with their company code, username and password.
// Usernames are unique only *within* a company, so the company code is what
// scopes the lookup. Company code is uppercased; username is lowercased to
// match how usernames are generated (admin01, manager01, staff01, …).
export const companyLoginSchema = z.object({
  companyCode: z
    .string()
    .trim()
    .min(1, "Company code is required")
    .transform((v) => v.toUpperCase()),
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

// ── Login error codes ──────────────────────────────────────────────────────
// Thrown server-side (as a CredentialsSignin `code`) and mapped to a friendly
// message on the client. Kept here so both server and client share one source.
export const LOGIN_ERROR = {
  INVALID_COMPANY: "invalid_company",
  INVALID_CREDENTIALS: "invalid_credentials",
  COMPANY_INACTIVE: "company_inactive",
  USER_INACTIVE: "user_inactive",
  ROLE_NOT_ALLOWED: "role_not_allowed",
} as const;

export type LoginErrorCode = (typeof LOGIN_ERROR)[keyof typeof LOGIN_ERROR];

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  [LOGIN_ERROR.INVALID_COMPANY]: "We couldn't find a company with that code.",
  [LOGIN_ERROR.INVALID_CREDENTIALS]: "Invalid username or password.",
  [LOGIN_ERROR.COMPANY_INACTIVE]:
    "This company is inactive. Please contact your administrator.",
  [LOGIN_ERROR.USER_INACTIVE]:
    "Your account is inactive. Please contact your company admin.",
  [LOGIN_ERROR.ROLE_NOT_ALLOWED]:
    "Your role is not allowed to sign in here.",
};

/** Map a login error `code` to a user-facing message (with a safe fallback). */
export function loginErrorMessage(code?: string | null): string {
  if (code && LOGIN_ERROR_MESSAGES[code]) return LOGIN_ERROR_MESSAGES[code];
  return "Something went wrong. Please try again.";
}

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
