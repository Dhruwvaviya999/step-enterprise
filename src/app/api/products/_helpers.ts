import { Prisma } from "@prisma/client";

// Relations every product response carries: brand (nullable), category, and
// variants ordered for stable display.
export const PRODUCT_INCLUDE = {
  brand: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  variants: {
    orderBy: [{ size: "asc" }, { color: "asc" }],
    select: {
      id: true,
      size: true,
      color: true,
      sizeType: true,
      shopQty: true,
      godownQty: true,
      minStock: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

// Convert a Prisma product (Decimal prices, nested brand) into the flat,
// number-priced shape the client UI works with.
export function mapProduct(p: ProductWithRelations) {
  return {
    id: p.id,
    articleNo: p.articleNo,
    articleName: p.articleName,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    sellingPrice: Number(p.sellingPrice),
    defaultPurchasePrice: Number(p.defaultPurchasePrice),
    isActive: p.isActive,
    variants: p.variants,
  };
}
