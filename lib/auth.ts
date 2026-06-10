import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  companyLoginSchema,
  superAdminLoginSchema,
  LOGIN_ERROR,
} from "@/lib/validators/auth";
import type { UserRole } from "@prisma/client";

// Roles that are allowed to sign in through company login. Super Admin is
// intentionally excluded — it has its own (separate) login.
const COMPANY_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

// A credentials error that carries a `code`. Auth.js exposes this code to the
// client (as `signIn(...).code`) so we can show a specific message, while the
// full error stays on the server. See lib/validators/auth.ts for the codes.
class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // ── Company user login ────────────────────────────────────────────────
    CredentialsProvider({
      id: "company-login",
      name: "Company Login",
      credentials: {
        companyCode: { label: "Company code", type: "text" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = companyLoginSchema.safeParse(credentials);
        if (!parsed.success) throw new LoginError(LOGIN_ERROR.INVALID_CREDENTIALS);

        const { companyCode, username, password } = parsed.data;

        // 1–2. Find the company by its code.
        const company = await prisma.company.findUnique({
          where: { code: companyCode },
          select: { id: true, isActive: true },
        });
        if (!company) throw new LoginError(LOGIN_ERROR.INVALID_COMPANY);

        // 5. Company must be active.
        if (!company.isActive) throw new LoginError(LOGIN_ERROR.COMPANY_INACTIVE);

        // 3. Find the user by username *within that company* (never Super Admin).
        const user = await prisma.user.findFirst({
          where: {
            companyId: company.id,
            username,
            role: { not: "SUPER_ADMIN" },
          },
        });
        if (!user || !user.password) {
          throw new LoginError(LOGIN_ERROR.INVALID_CREDENTIALS);
        }

        // 4. Verify the password.
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new LoginError(LOGIN_ERROR.INVALID_CREDENTIALS);

        // 6. User must be active.
        if (!user.isActive) throw new LoginError(LOGIN_ERROR.USER_INACTIVE);

        // 7. Role must be one of the allowed company roles.
        if (!COMPANY_ROLES.includes(user.role)) {
          throw new LoginError(LOGIN_ERROR.ROLE_NOT_ALLOWED);
        }

        // 8. Hand the user to the JWT/session callbacks.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),

    // ── Super Admin login ─────────────────────────────────────────────────
    CredentialsProvider({
      id: "super-admin-login",
      name: "Super Admin Login",
      credentials: {
        identifier: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = superAdminLoginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error("Invalid credentials");

        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            companyId: null,
            role: "SUPER_ADMIN",
            OR: [{ username: identifier }, { email: identifier }],
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
          companyId: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role as UserRole;
        token.companyId = (user as any).companyId as string | null;
        token.username = (user as any).username as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.companyId = token.companyId as string | null;
        session.user.username = token.username as string | null;
      }
      return session;
    },
  },
});