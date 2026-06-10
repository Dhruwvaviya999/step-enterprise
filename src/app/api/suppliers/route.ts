import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyUser, requireRole, AuthError } from "@/lib/session";
import { supplierSchema } from "@/lib/validators/supplier";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";

const SUPPLIER_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Blank strings from the form become null in the database.
function blankToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ── List suppliers for the current company (any company role) ──────────────
// Optional ?search= filters by name (case-insensitive). Always scoped to the
// session's companyId so a company only ever sees its own suppliers.
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId: user.companyId,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      select: SUPPLIER_SELECT,
      orderBy: { name: "asc" },
    });

    return apiSuccess(suppliers);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── Create a supplier (ADMIN / MANAGER) ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const supplier = await prisma.supplier.create({
      data: {
        companyId: user.companyId,
        name: parsed.data.name,
        phone: blankToNull(parsed.data.phone),
        email: blankToNull(parsed.data.email),
        address: blankToNull(parsed.data.address),
      },
      select: SUPPLIER_SELECT,
    });

    return apiCreated(supplier);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    // Unique [companyId, name] violation → this company already has the supplier.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("A supplier with this name already exists", 409);
    }
    return apiCatch(error);
  }
}
