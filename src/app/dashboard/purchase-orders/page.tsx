import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listPurchaseOrders } from "@/lib/actions/purchase-orders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PurchaseOrdersManager } from "@/components/purchase-orders/purchase-orders-manager";
import type {
  SupplierOption,
  VariantOption,
} from "@/components/purchase-orders/types";

export const metadata = { title: "Purchase Orders" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function PurchaseOrdersPage() {
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
            Your account isn&apos;t linked to a company, so there are no purchase
            orders to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = user.companyId;

  const [orders, suppliers, variantRows] = await Promise.all([
    listPurchaseOrders(companyId),
    prisma.supplier.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { companyId },
      orderBy: [{ product: { articleName: "asc" } }, { size: "asc" }],
      select: {
        id: true,
        size: true,
        color: true,
        sizeType: true,
        product: {
          select: {
            articleNo: true,
            articleName: true,
            defaultPurchasePrice: true,
          },
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
    defaultPurchasePrice: Number(v.product.defaultPurchasePrice),
    label: `${v.product.articleNo} · ${v.product.articleName} · ${v.size}/${v.color} · ${v.sizeType === "BIG" ? "Big" : "Small"}`,
  }));

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          Order stock from suppliers and receive it into inventory.
        </p>
      </div>

      <PurchaseOrdersManager
        initialOrders={orders}
        suppliers={suppliers as SupplierOption[]}
        variants={variants}
        canManage={canManage}
      />
    </div>
  );
}
