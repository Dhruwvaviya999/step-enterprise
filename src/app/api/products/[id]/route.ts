import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import { updateProductSchema } from "@/lib/validators/product";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";
import { PRODUCT_INCLUDE, mapProduct } from "../_helpers";

// ── Update product fields (ADMIN / MANAGER) ────────────────────────────────
// Variants are managed through the /variants endpoints; this only edits the
// product's own fields.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const companyId = user.companyId;

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);
    const data = parsed.data;

    // Ownership guard.
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Product not found");

    // Validate category/brand belong to this company.
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, companyId },
      select: { id: true },
    });
    if (!category) return apiError("Selected category is invalid", 400);

    const brandId = data.brandId?.trim() || null;
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: brandId, companyId },
        select: { id: true },
      });
      if (!brand) return apiError("Selected brand is invalid", 400);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        articleNo: data.articleNo,
        articleName: data.articleName,
        brandId,
        categoryId: data.categoryId,
        sellingPrice: data.sellingPrice,
        defaultPurchasePrice: data.defaultPurchasePrice,
        isActive: data.isActive,
      },
      include: PRODUCT_INCLUDE,
    });

    return apiSuccess(mapProduct(product));
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("A product with this article number already exists", 409);
    }
    return apiCatch(error);
  }
}

// ── Delete a product and its variants (ADMIN / MANAGER) ────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const companyId = user.companyId;

    const existing = await prisma.product.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Product not found");

    // Variants reference the product with onDelete: Restrict, so remove them
    // first, then the product — atomically.
    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id, companyId } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return apiSuccess({ id });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    // A variant is still referenced by a purchase/sales/movement record.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return apiError(
        "This product is referenced by other records and can't be deleted.",
        409,
      );
    }
    return apiCatch(error);
  }
}
