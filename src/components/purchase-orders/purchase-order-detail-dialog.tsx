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
  type PurchaseOrderRow,
  PO_STATUS_META,
  formatDate,
  formatMoney,
  itemPending,
  lineTotal,
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

export function PurchaseOrderDetailDialog({
  open,
  onOpenChange,
  purchaseOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrderRow | null;
}) {
  if (!purchaseOrder) return null;
  const po = purchaseOrder;
  const meta = PO_STATUS_META[po.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {po.orderNo}
            <Badge variant="outline" className={meta.className}>
              {meta.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>Purchase order details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Supplier" value={po.supplierName} />
          <Info label="Order date" value={formatDate(po.orderDate)} />
          <Info label="Expected" value={formatDate(po.expectedDate)} />
          <Info label="Total" value={formatMoney(po.totalAmount)} />
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Ordered</TableHead>
                <TableHead className="text-center">Received</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="font-medium">{it.articleName}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.articleNo} · {it.size} / {it.color}
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {it.orderedQty}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {it.receivedQty}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {itemPending(it)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(it.unitPurchasePrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(lineTotal(it))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {po.note && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Note
            </p>
            <p className="text-sm">{po.note}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
