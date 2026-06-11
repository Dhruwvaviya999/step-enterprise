"use client";

import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
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
  type SalesOrderRow,
  SO_STATUS_META,
  formatDate,
  formatMoney,
  totalUnits,
  isDraft,
  isCancelable,
} from "./types";

export function SalesOrderTable({
  orders,
  canManage,
  onView,
  onComplete,
  onEdit,
  onCancel,
  onDelete,
}: {
  orders: SalesOrderRow[];
  canManage: boolean;
  onView: (so: SalesOrderRow) => void;
  onComplete: (so: SalesOrderRow) => void;
  onEdit: (so: SalesOrderRow) => void;
  onCancel: (so: SalesOrderRow) => void;
  onDelete: (so: SalesOrderRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Units</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[1%] text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((so) => {
            const meta = SO_STATUS_META[so.status];
            const draft = isDraft(so);
            const showMenu = canManage && (draft || isCancelable(so));
            return (
              <TableRow
                key={so.id}
                className="cursor-pointer"
                onClick={() => onView(so)}
              >
                <TableCell className="font-mono text-xs font-medium">
                  {so.invoiceNo}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={meta.className}>
                    {meta.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {totalUnits(so)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(so.totalAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(so.soldAt)}
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
                          aria-label={`Actions for ${so.invoiceNo}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onView(so)}>
                        <Eye className="size-4 text-muted-foreground" /> View
                      </DropdownMenuItem>

                      {canManage && draft && (
                        <>
                          <DropdownMenuItem onClick={() => onComplete(so)}>
                            <CheckCircle2 className="size-4 text-muted-foreground" />
                            Complete sale
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(so)}>
                            <Pencil className="size-4 text-muted-foreground" /> Edit
                          </DropdownMenuItem>
                        </>
                      )}

                      {showMenu && <DropdownMenuSeparator />}
                      {canManage && isCancelable(so) && (
                        <DropdownMenuItem onClick={() => onCancel(so)}>
                          <Ban className="size-4 text-muted-foreground" /> Cancel
                        </DropdownMenuItem>
                      )}
                      {canManage && draft && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(so)}
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
