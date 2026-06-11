import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCompanyUser, requireRole, AuthError } from "@/lib/session";
import { createProductSchema } from "@/lib/validators/product";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiValidationError,
  apiCatch,
} from "@/lib/api-response";
import { PRODUCT_INCLUDE, mapProduct } from "./_helpers";

// ── List products for the current company (any company role) ───────────────
// Optional ?search= does a light server filter by article no/name; the client
// additionally filters by brand/category/size/color over the returned list.
export async function GET(req: NextRequest) {
  try {
    const user = await requireCompanyUser();
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const products = await prisma.product.findMany({
      where: {
        companyId: user.companyId,
        ...(search
          ? {
              OR: [
                { articleNo: { contains: search, mode: "insensitive" } },
                { articleName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: PRODUCT_INCLUDE,
      orderBy: { articleName: "asc" },
    });

    return apiSuccess(products.map(mapProduct));
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    return apiCatch(error);
  }
}

// ── Create a product with its variants (ADMIN / MANAGER) ───────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN", "MANAGER");

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const data = parsed.data;
    const companyId = user.companyId;

    // Category must belong to THIS company (never trust a client-supplied id).
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, companyId },
      select: { id: true },
    });
    if (!category) return apiError("Selected category is invalid", 400);

    // Brand is optional; if given it must also belong to this company.
    const brandId = data.brandId?.trim() || null;
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: brandId, companyId },
        select: { id: true },
      });
      if (!brand) return apiError("Selected brand is invalid", 400);
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        articleNo: data.articleNo,
        articleName: data.articleName,
        brandId,
        categoryId: data.categoryId,
        sellingPrice: data.sellingPrice,
        defaultPurchasePrice: data.defaultPurchasePrice,
        isActive: data.isActive,
        variants: {
          create: data.variants.map((v) => ({
            companyId,
            size: v.size,
            color: v.color,
            sizeType: v.sizeType,
            shopQty: v.shopQty,
            godownQty: v.godownQty,
            minStock: v.minStock,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    return apiCreated(mapProduct(product));
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Either the article number or a duplicate size+color variant collided.
      const target = String(error.meta?.target ?? "");
      if (target.includes("article"))
        return apiError("A product with this article number already exists", 409);
      return apiError(
        "Duplicate variant: each size + color + size type must be unique",
        409,
      );
    }
    return apiCatch(error);
  }
}
