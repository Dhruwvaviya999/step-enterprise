import { TriangleAlert } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  buildHistoryFilter,
  getInventoryHistory,
} from "@/lib/actions/inventory-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HistoryView } from "@/components/history/history-view";

export const metadata = { title: "Stock History" };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The dashboard layout guarantees an authenticated company user; we read the
  // session here to scope every query to THIS company only (never company code).
  const user = await getCurrentUser();

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-8xl">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>No company associated</AlertTitle>
          <AlertDescription>
            Your account isn&apos;t linked to a company, so there is no inventory
            history to show.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const raw = await searchParams;
  const filter = buildHistoryFilter(user.companyId, raw);

  const [data, products] = await Promise.all([
    getInventoryHistory(filter),
    prisma.product.findMany({
      where: { companyId: user.companyId },
      select: { id: true, articleNo: true, articleName: true },
      orderBy: { articleName: "asc" },
    }),
  ]);

  const productOptions = products.map((p) => ({
    id: p.id,
    label: `${p.articleNo} · ${p.articleName}`,
  }));

  // Current filter values (strings) to seed the read-only filter controls.
  const pick = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";
  const current = {
    type: pick(raw.type),
    location: pick(raw.location),
    productId: pick(raw.productId),
    q: pick(raw.q),
    range: pick(raw.range) || "all",
    from: pick(raw.from),
    to: pick(raw.to),
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stock History</h1>
        <p className="text-sm text-muted-foreground">
          Every inventory movement — the source of truth for stock changes.
        </p>
      </div>

      <HistoryView data={data} products={productOptions} current={current} />
    </div>
  );
}
