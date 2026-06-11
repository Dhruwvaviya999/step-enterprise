import { ArrowDownLeft, ArrowUpRight, Layers, Scale } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { HistoryResult } from "@/lib/actions/inventory-history";
import { formatNumber } from "./meta";

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Layers;
  tone?: "in" | "out";
}) {
  const color =
    tone === "in"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "out"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-1 truncate text-xl font-bold tabular-nums ${color}`}>
              {value}
            </p>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** In/out summary for the current filter set (across all matching records). */
export function HistorySummary({ summary }: { summary: HistoryResult["summary"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Movements" value={formatNumber(summary.totalRecords)} icon={Layers} />
      <Stat label="Stock in" value={`+${formatNumber(summary.inUnits)}`} icon={ArrowUpRight} tone="in" />
      <Stat label="Stock out" value={`-${formatNumber(summary.outUnits)}`} icon={ArrowDownLeft} tone="out" />
      <Stat
        label="Net change"
        value={`${summary.netUnits >= 0 ? "+" : ""}${formatNumber(summary.netUnits)}`}
        icon={Scale}
      />
    </div>
  );
}
