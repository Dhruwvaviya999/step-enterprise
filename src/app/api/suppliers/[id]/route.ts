import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import { supplierSchema } from "@/lib/validators/supplier";
import {
  apiSuccess,
  apiError,
  apiNotFound,
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

function blankToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

// ── Update a supplier (ADMIN / MANAGER) ────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = supplierSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // Guard ownership first so a wrong/foreign id returns 404, not a leak.
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Supplier not found");

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phone: blankToNull(parsed.data.phone),
        email: blankToNull(parsed.data.email),
        address: blankToNull(parsed.data.address),
      },
      select: SUPPLIER_SELECT,
    });

    return apiSuccess(supplier);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("A supplier with this name already exists", 409);
    }
    return apiCatch(error);
  }
}

// ── Delete a supplier (ADMIN / MANAGER) ────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");

    const existing = await prisma.supplier.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, _count: { select: { purchaseOrders: true } } },
    });
    if (!existing) return apiNotFound("Supplier not found");

    // Don't orphan purchase orders that still reference this supplier.
    if (existing._count.purchaseOrders > 0) {
      return apiError(
        "This supplier is linked to one or more purchase orders and can't be deleted.",
        409,
      );
    }

    await prisma.supplier.delete({ where: { id } });

    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}
