import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listSalesOrders } from "@/lib/actions/sales-orders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SalesOrdersManager } from "@/components/sales-orders/sales-orders-manager";
import type { VariantOption } from "@/components/sales-orders/types";

export const metadata = { title: "Sales Orders" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function SalesOrdersPage() {
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
            Your account isn&apos;t linked to a company, so there are no sales
            orders to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = user.companyId;

  const [orders, variantRows] = await Promise.all([
    listSalesOrders(companyId),
    prisma.productVariant.findMany({
      where: { companyId, product: { isActive: true } },
      orderBy: [{ product: { articleName: "asc" } }, { size: "asc" }],
      select: {
        id: true,
        size: true,
        color: true,
        sizeType: true,
        shopQty: true,
        godownQty: true,
        product: {
          select: { articleNo: true, articleName: true, sellingPrice: true },
        },
      },
    }),
  ]);

  const variants: VariantOption[] = variantRows.map((v) => ({
    variantId: v.id,
    articleNo: v.product.articleNo,
    articleName: v.product.articleName,
    size: v.size,
    color: v.color,
    sellingPrice: Number(v.product.sellingPrice),
    shopQty: v.shopQty,
    godownQty: v.godownQty,
    label: `${v.product.articleNo} · ${v.product.articleName} · ${v.size}/${v.color} · ${v.sizeType === "BIG" ? "Big" : "Small"}`,
  }));

  // STAFF may create sales (per the role matrix); managing (complete/cancel/
  // edit/delete) is ADMIN/MANAGER only.
  const canCreate = true; // any company user
  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sales Orders</h1>
        <p className="text-sm text-muted-foreground">
          Record sales invoices — completing a sale reduces stock automatically.
        </p>
      </div>

      <SalesOrdersManager
        initialOrders={orders}
        variants={variants}
        canCreate={canCreate}
        canManage={canManage}
      />
    </div>
  );
}
