import { ReceiptText } from "lucide-react";

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
import type { SalesReport as SalesReportData } from "@/lib/reports/report-service";
import { SalesTrendChart } from "./charts/sales-trend-chart";
import { MiniStat, ReportEmpty } from "./report-section";
import { formatMoney, formatNumber } from "./format";

export function SalesReport({ data }: { data: SalesReportData }) {
  if (data.totalOrders === 0) {
    return (
      <ReportEmpty
        icon={ReceiptText}
        title="No sales in this range"
        description="Completed sales invoices in the selected dates will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="Orders" value={formatNumber(data.totalOrders)} />
        <MiniStat label="Units sold" value={formatNumber(data.totalQty)} />
        <MiniStat label="Sales amount" value={formatMoney(data.totalAmount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Trend</CardTitle>
          <CardDescription>Daily sales amount over the range</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesTrendChart data={data.trend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopTable rows={data.topProducts} firstCol="Product" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <TopTable rows={data.topVariants} firstCol="Variant" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TopTable({
  rows,
  firstCol,
}: {
  rows: { name: string; qty: number; amount: number }[];
  firstCol: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{firstCol}</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-center tabular-nums">
                {formatNumber(r.qty)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(r.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
