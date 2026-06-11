import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import { variantSchema } from "@/lib/validators/product";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";

const VARIANT_SELECT = {
  id: true,
  size: true,
  color: true,
  sizeType: true,
  shopQty: true,
  godownQty: true,
  minStock: true,
} as const;

// ── Update a variant (ADMIN / MANAGER) ─────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    const { id: productId, variantId } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const companyId = user.companyId;

    // Ownership: the variant must belong to this product AND this company.
    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Variant not found");

    const body = await req.json();
    const parsed = variantSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: parsed.data,
      select: VARIANT_SELECT,
    });

    return apiSuccess(variant);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("This size + color + size type variant already exists", 409);
    }
    return apiCatch(error);
  }
}

// ── Delete a variant (ADMIN / MANAGER) ─────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    const { id: productId, variantId } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const companyId = user.companyId;

    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Variant not found");

    await prisma.productVariant.delete({ where: { id: variantId } });

    return apiSuccess({ id: variantId });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    // Referenced by a purchase/sales/movement record (onDelete: Restrict).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return apiError(
        "This variant is referenced by other records and can't be deleted.",
        409,
      );
    }
    return apiCatch(error);
  }
}
