"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type SalesOrderRow,
  SO_STATUS_META,
  formatDate,
  formatMoney,
} from "./types";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function SalesOrderDetailDialog({
  open,
  onOpenChange,
  salesOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrderRow | null;
}) {
  if (!salesOrder) return null;
  const so = salesOrder;
  const meta = SO_STATUS_META[so.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {so.invoiceNo}
            <Badge variant="outline" className={meta.className}>
              {meta.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>Sales invoice details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Info label="Date" value={formatDate(so.soldAt)} />
          <Info label="Sold by" value={so.createdByName ?? "—"} />
          <Info label="Units" value={so.items.reduce((s, i) => s + i.quantity, 0)} />
          <Info label="Total" value={formatMoney(so.totalAmount)} />
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {so.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="font-medium">{it.articleName}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.articleNo} · {it.size} / {it.color}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {it.soldFrom === "SHOP" ? "Shop" : "Godown"}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {it.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(it.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(it.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {so.note && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Note
            </p>
            <p className="text-sm">{so.note}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
