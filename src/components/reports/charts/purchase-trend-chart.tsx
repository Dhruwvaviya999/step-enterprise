"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrendPoint } from "@/lib/reports/report-service";
import { formatNumber } from "../format";

const config = {
  qty: { label: "Units received", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function PurchaseTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
          tickFormatter={(v) => formatNumber(Number(v))}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="qty" fill="var(--color-qty)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
