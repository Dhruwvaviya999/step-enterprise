import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProductsManager } from "@/components/products/products-manager";
import type { Option, ProductRow } from "@/components/products/types";

export const metadata = { title: "Products" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function ProductsPage() {
  // The dashboard layout guarantees an authenticated company user; we read the
  // session here to scope every query to THIS company only (never company code).
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-6xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there are no products
            to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = user.companyId;

  const [productRows, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where: { companyId },
      include: {
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
      },
      orderBy: { articleName: "asc" },
    }),
    prisma.brand.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Decimal → number at the server boundary so the client only sees numbers.
  const initialProducts: ProductRow[] = productRows.map((p) => ({
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
  }));

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your articles, variants and stock levels.
        </p>
      </div>

      <ProductsManager
        initialProducts={initialProducts}
        brands={brands as Option[]}
        categories={categories as Option[]}
        canManage={canManage}
      />
    </div>
  );
}
