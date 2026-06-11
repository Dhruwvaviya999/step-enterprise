import { Boxes } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockReport as StockReportData } from "@/lib/reports/report-service";
import { StockByCategoryChart } from "./charts/stock-by-category-chart";
import { StockByBrandChart } from "./charts/stock-by-brand-chart";
import { MiniStat, ReportEmpty } from "./report-section";
import { formatNumber } from "./format";

export function StockReport({ data }: { data: StockReportData }) {
  if (data.totalVariants === 0) {
    return (
      <ReportEmpty
        icon={Boxes}
        title="No stock data"
        description="Add products with variants to see stock reports."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Variants" value={formatNumber(data.totalVariants)} />
        <MiniStat label="Shop stock" value={formatNumber(data.totalShopQty)} />
        <MiniStat label="Godown stock" value={formatNumber(data.totalGodownQty)} />
        <MiniStat label="Total units" value={formatNumber(data.totalQty)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock by Category</CardTitle>
            <CardDescription>Units on hand per category</CardDescription>
          </CardHeader>
          <CardContent>
            <StockByCategoryChart data={data.byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock by Brand</CardTitle>
            <CardDescription>Share of units per brand</CardDescription>
          </CardHeader>
          <CardContent>
            <StockByBrandChart data={data.byBrand} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock by Product</CardTitle>
          <CardDescription>Total units across all variants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byProduct.map((p) => (
                  <TableRow key={p.articleNo}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {p.articleNo}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(p.qty)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
