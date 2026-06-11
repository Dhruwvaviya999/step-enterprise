import { Truck } from "lucide-react";

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
import type { PurchaseReport as PurchaseReportData } from "@/lib/reports/report-service";
import { PurchaseTrendChart } from "./charts/purchase-trend-chart";
import { MiniStat, ReportEmpty } from "./report-section";
import { formatMoney, formatNumber } from "./format";

export function PurchaseReport({ data }: { data: PurchaseReportData }) {
  if (data.totalQty === 0) {
    return (
      <ReportEmpty
        icon={Truck}
        title="No purchases in this range"
        description="Stock received on purchase orders in the selected dates will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat label="POs received" value={formatNumber(data.totalOrders)} />
        <MiniStat label="Units received" value={formatNumber(data.totalQty)} />
        <MiniStat label="Purchase value" value={formatMoney(data.totalAmount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchase Trend</CardTitle>
          <CardDescription>Units received per day over the range</CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseTrendChart data={data.trend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier-wise Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bySupplier.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {formatNumber(s.qty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(s.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Purchased Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.map((p) => (
                    <TableRow key={p.name}>
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
    </div>
  );
}
