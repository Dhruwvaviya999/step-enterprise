"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrendPoint } from "@/lib/reports/report-service";
import { formatMoneyCompact } from "../format";

const config = {
  amount: { label: "Sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
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
          width={48}
          tickFormatter={(v) => formatMoneyCompact(Number(v))}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatMoneyCompact(Number(value))}
            />
          }
        />
        <Area
          dataKey="amount"
          type="monotone"
          stroke="var(--color-amount)"
          fill="url(#fillSales)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
