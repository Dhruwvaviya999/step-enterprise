"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportData } from "@/lib/reports/report-service";
import { ReportSummaryCards } from "./report-summary-cards";
import { DateRangeFilter } from "./date-range-filter";
import { StockReport } from "./stock-report";
import { SalesReport } from "./sales-report";
import { PurchaseReport } from "./purchase-report";
import { LowStockReport } from "./low-stock-report";

export function ReportsView({ data }: { data: ReportData }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Sales &amp; purchase figures reflect the selected date range; stock is
          current.
        </p>
        <DateRangeFilter
          currentKey={data.range.key}
          from={data.range.from}
          to={data.range.to}
        />
      </div>

      <ReportSummaryCards summary={data.summary} />

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-1.5">
            Low Stock
            {data.lowStock.length > 0 && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              >
                {data.lowStock.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <StockReport data={data.stock} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesReport data={data.sales} />
        </TabsContent>
        <TabsContent value="purchase">
          <PurchaseReport data={data.purchase} />
        </TabsContent>
        <TabsContent value="low-stock">
          <LowStockReport rows={data.lowStock} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
