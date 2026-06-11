import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listTransfers } from "@/lib/actions/transfers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TransfersManager } from "@/components/transfers/transfers-manager";
import type { VariantOption } from "@/components/transfers/types";

export const metadata = { title: "Stock Transfers" };

const MANAGE_ROLES = ["ADMIN", "MANAGER"] as const;

export default async function TransfersPage() {
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
            Your account isn&apos;t linked to a company, so there are no transfers
            to manage.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = user.companyId;

  const [transfers, variantRows] = await Promise.all([
    listTransfers(companyId),
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
        product: { select: { articleNo: true, articleName: true } },
      },
    }),
  ]);

  const variants: VariantOption[] = variantRows.map((v) => ({
    variantId: v.id,
    articleNo: v.product.articleNo,
    articleName: v.product.articleName,
    size: v.size,
    color: v.color,
    shopQty: v.shopQty,
    godownQty: v.godownQty,
    label: `${v.product.articleNo} · ${v.product.articleName} · ${v.size}/${v.color} · ${v.sizeType === "BIG" ? "Big" : "Small"}`,
  }));

  const canManage = (MANAGE_ROLES as readonly string[]).includes(user.role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stock Transfers</h1>
        <p className="text-sm text-muted-foreground">
          Move stock between Shop and Godown — quantities update automatically.
        </p>
      </div>

      <TransfersManager
        initialTransfers={transfers}
        variants={variants}
        canManage={canManage}
      />
    </div>
  );
}
