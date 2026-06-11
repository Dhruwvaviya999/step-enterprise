"use client";

import { ArrowRight, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TransferRow, formatDate, locationLabel } from "./types";

export function TransferTable({
  transfers,
  onView,
}: {
  transfers: TransferRow[];
  onView: (t: TransferRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transfer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-center">Qty</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[1%] text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.map((t) => (
            <TableRow
              key={t.id}
              className="cursor-pointer"
              onClick={() => onView(t)}
            >
              <TableCell className="font-mono text-xs font-medium">
                {t.transferNo}
              </TableCell>
              <TableCell>
                <div className="font-medium">{t.articleName}</div>
                <div className="text-xs text-muted-foreground">
                  {t.size} / {t.color}
                </div>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-xs">
                  <Badge variant="outline">{locationLabel(t.fromLocation)}</Badge>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <Badge variant="secondary">{locationLabel(t.toLocation)}</Badge>
                </span>
              </TableCell>
              <TableCell className="text-center tabular-nums">{t.quantity}</TableCell>
              <TableCell className="text-muted-foreground">
                {t.createdByName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(t.createdAt)}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  aria-label={`View ${t.transferNo}`}
                  onClick={() => onView(t)}
                >
                  <Eye className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
