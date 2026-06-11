import { z } from "zod";

// Company users only — Super Admin is created elsewhere and never assignable here.
export const COMPANY_USER_ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;
export const roleEnum = z.enum(COMPANY_USER_ROLES);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

// Optional email: "" or a valid address. companyId + username are never taken
// from the body — companyId comes from the session, username is auto-generated.
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .or(z.literal(""))
  .optional();

// ── Create user ────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: emailField,
  role: roleEnum,
  password: passwordSchema,
  isActive: z.boolean().default(true),
});

// ── Update user ────────────────────────────────────────────────────────────
// Password is optional — blank means "keep the current password".
export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: emailField,
  role: roleEnum,
  isActive: z.boolean(),
  password: passwordSchema.or(z.literal("")).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
