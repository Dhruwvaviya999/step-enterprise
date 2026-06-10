import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, AuthError } from "@/lib/session";
import { registerCompanySchema } from "@/lib/validators/company";
import { generateUniqueCompanyCode } from "@/lib/companies";
import {
  apiSuccess,
  apiCreated,
  apiCatch,
  apiError,
  apiValidationError,
} from "@/lib/api-response";

// ── List companies (Super Admin only) ──────────────────────────────────────
export async function GET() {
  try {
    await requireSuperAdmin();

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    return apiSuccess(companies);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── Register a company + its first ADMIN (Super Admin only) ─────────────────
export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin();

    const body = await req.json();
    const parsed = registerCompanySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { companyName, adminName, adminEmail, adminPassword } = parsed.data;

    // Email is globally unique across all users.
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      return apiError("An account with this email already exists", 409);
    }

    const code = await generateUniqueCompanyCode(companyName);
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Company + admin must succeed or fail together.
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName, code },
      });

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
          companyId: company.id,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      return { company, admin };
    });

    return apiCreated({
      company: {
        id: result.company.id,
        name: result.company.name,
        code: result.company.code,
      },
      admin: result.admin,
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
