"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { NamedQty } from "@/lib/reports/report-service";

const config = {
  qty: { label: "Units", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Horizontal bar of stock units per category (top 8). */
export function StockByCategoryChart({ data }: { data: NamedQty[] }) {
  const rows = data.slice(0, 8);
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={96}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="qty" fill="var(--color-qty)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
