import {
  Package,
  Boxes,
  AlertTriangle,
  IndianRupee,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ReportSummary } from "@/lib/reports/report-service";
import { formatMoney, formatNumber } from "./format";

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={`truncate text-2xl font-bold tabular-nums ${
                alert ? "text-amber-600 dark:text-amber-400" : ""
              }`}
            >
              {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
          </div>
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted ${
              alert ? "text-amber-600 dark:text-amber-400" : "text-foreground"
            }`}
          >
            <Icon className="size-4.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Top-level KPI row. Stock/products/low-stock are current; sales/purchase are
 *  for the selected date range. */
export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat
        label="Total Products"
        value={formatNumber(summary.totalProducts)}
        icon={Package}
      />
      <Stat
        label="Total Stock"
        value={formatNumber(summary.totalStock)}
        hint="Units on hand"
        icon={Boxes}
      />
      <Stat
        label="Low Stock"
        value={formatNumber(summary.lowStockCount)}
        hint="At/below min"
        icon={AlertTriangle}
        alert={summary.lowStockCount > 0}
      />
      <Stat
        label="Sales"
        value={formatMoney(summary.totalSalesAmount)}
        hint="In range"
        icon={IndianRupee}
      />
      <Stat
        label="Purchased"
        value={formatNumber(summary.totalPurchaseQty)}
        hint="Units · in range"
        icon={Truck}
      />
    </div>
  );
}
