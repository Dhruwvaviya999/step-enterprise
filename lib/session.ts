import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  companyId: string | null;
}

// ── Get current session user (throws-free) ────────────────────────────────
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

// ── Require auth — use inside API routes ──────────────────────────────────
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

// ── Require a Super Admin (global, no company) ─────────────────────────────
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "SUPER_ADMIN") {
    throw new AuthError("Super Admin access required", 403);
  }
  return user;
}

// ── Require auth + companyId (any company-scoped user) ─────────────────────
export async function requireCompanyUser(): Promise<
  SessionUser & { companyId: string }
> {
  const user = await requireAuth();
  if (!user.companyId) throw new AuthError("No company associated", 403);
  return user as SessionUser & { companyId: string };
}

// ── Require specific roles within a company ────────────────────────────────
export async function requireRole(
  ...roles: UserRole[]
): Promise<SessionUser & { companyId: string }> {
  const user = await requireCompanyUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

// ── Custom error class ─────────────────────────────────────────────────────
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}