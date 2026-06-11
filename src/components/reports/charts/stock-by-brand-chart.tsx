"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { NamedQty } from "@/lib/reports/report-service";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Donut of stock units per brand (top 5, remainder folded into "Other"). */
export function StockByBrandChart({ data }: { data: NamedQty[] }) {
  const top = data.slice(0, 5);
  const otherQty = data.slice(5).reduce((s, d) => s + d.qty, 0);
  const rows = otherQty > 0 ? [...top, { name: "Other", qty: otherQty }] : top;

  const config: ChartConfig = Object.fromEntries(
    rows.map((r, i) => [r.name, { label: r.name, color: PALETTE[i % PALETTE.length] }]),
  );

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={rows} dataKey="qty" nameKey="name" innerRadius={56} strokeWidth={3}>
          {rows.map((r, i) => (
            <Cell key={r.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="flex-wrap gap-x-3 gap-y-1"
        />
      </PieChart>
    </ChartContainer>
  );
}
