"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HistoryItem } from "@/lib/actions/inventory-history";
import { MOVEMENT_BADGE, formatDateTime } from "./meta";

export function HistoryTable({ items }: { items: HistoryItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => {
            const positive = m.quantity > 0;
            return (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(m.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${MOVEMENT_BADGE[m.movementType]}`}
                  >
                    {m.movementLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{m.product.articleName}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {m.product.articleNo}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {m.variant.size} / {m.variant.color}
                  <span className="ml-1 text-xs text-muted-foreground/70">
                    ({m.variant.sizeType === "BIG" ? "Big" : "Small"})
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {m.location === "SHOP" ? "Shop" : "Godown"}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold tabular-nums ${
                    positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {positive ? "+" : ""}
                  {m.quantity}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  <span className="text-muted-foreground">{m.source.type}</span>
                  {m.source.ref && (
                    <span className="ml-1 font-mono">{m.source.ref}</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {m.createdBy ?? "—"}
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">
                  {m.note ?? <span className="text-muted-foreground/40">—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
