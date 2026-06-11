import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/session";
import { variantSchema } from "@/lib/validators/product";
import {
  apiCreated,
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

// ── Add a variant to a product (ADMIN / MANAGER) ───────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const user = await requireRole("ADMIN", "MANAGER");
    const companyId = user.companyId;

    // The product must belong to this company.
    const product = await prisma.product.findFirst({
      where: { id: productId, companyId },
      select: { id: true },
    });
    if (!product) return apiNotFound("Product not found");

    const body = await req.json();
    const parsed = variantSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const variant = await prisma.productVariant.create({
      data: { ...parsed.data, productId, companyId },
      select: VARIANT_SELECT,
    });

    return apiCreated(variant);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("This size + color + size type variant already exists", 409);
    }
    return apiCatch(error);
  }
}
