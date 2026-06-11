"use client";

import {
  MoreHorizontal,
  Eye,
  PackageCheck,
  Pencil,
  Ban,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  isReceivable,
  isEditable,
  isCancelable,
  isDeletable,
  orderedTotal,
  receivedTotal,
} from "./types";

export function PurchaseOrderTable({
  orders,
  canManage,
  onView,
  onReceive,
  onEdit,
  onCancel,
  onDelete,
}: {
  orders: PurchaseOrderRow[];
  canManage: boolean;
  onView: (po: PurchaseOrderRow) => void;
  onReceive: (po: PurchaseOrderRow) => void;
  onEdit: (po: PurchaseOrderRow) => void;
  onCancel: (po: PurchaseOrderRow) => void;
  onDelete: (po: PurchaseOrderRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO No.</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Received</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Order date</TableHead>
            <TableHead className="w-[1%] text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((po) => {
            const meta = PO_STATUS_META[po.status];
            const ordered = orderedTotal(po);
            const received = receivedTotal(po);
            return (
              <TableRow
                key={po.id}
                className="cursor-pointer"
                onClick={() => onView(po)}
              >
                <TableCell className="font-mono text-xs font-medium">
                  {po.orderNo}
                </TableCell>
                <TableCell>{po.supplierName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={meta.className}>
                    {meta.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {received}/{ordered}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(po.totalAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(po.orderDate)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${po.orderNo}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onView(po)}>
                        <Eye className="size-4 text-muted-foreground" /> View
                      </DropdownMenuItem>

                      {canManage && isReceivable(po) && (
                        <DropdownMenuItem onClick={() => onReceive(po)}>
                          <PackageCheck className="size-4 text-muted-foreground" />
                          Receive stock
                        </DropdownMenuItem>
                      )}
                      {canManage && isEditable(po) && (
                        <DropdownMenuItem onClick={() => onEdit(po)}>
                          <Pencil className="size-4 text-muted-foreground" /> Edit
                        </DropdownMenuItem>
                      )}

                      {canManage && (isCancelable(po) || isDeletable(po)) && (
                        <DropdownMenuSeparator />
                      )}
                      {canManage && isCancelable(po) && (
                        <DropdownMenuItem onClick={() => onCancel(po)}>
                          <Ban className="size-4 text-muted-foreground" /> Cancel
                        </DropdownMenuItem>
                      )}
                      {canManage && isDeletable(po) && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(po)}
                        >
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
