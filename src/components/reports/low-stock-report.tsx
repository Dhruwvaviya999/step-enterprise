import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { LowStockRow } from "@/lib/reports/report-service";
import { ReportEmpty } from "./report-section";

export function LowStockReport({ rows }: { rows: LowStockRow[] }) {
  if (rows.length === 0) {
    return (
      <ReportEmpty
        icon={CheckCircle2}
        title="No low-stock variants"
        description="Every variant is above its minimum stock threshold."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Low Stock</CardTitle>
        <CardDescription>
          Variants at or below their minimum stock ({rows.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-center">Shop</TableHead>
                <TableHead className="text-center">Godown</TableHead>
                <TableHead className="text-center">Min</TableHead>
                <TableHead className="text-center">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.articleNo}-${r.size}-${r.color}-${i}`}>
                  <TableCell>
                    <div className="font-medium">{r.productName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {r.articleNo}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.size} / {r.color}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.shopQty}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.godownQty}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {r.minStock}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        r.difference < 0
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }
                    >
                      {r.difference}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
