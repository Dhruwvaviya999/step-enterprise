"use client";

import { Pencil, Trash2 } from "lucide-react";

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
import { type VariantRow, variantTotal, sizeTypeLabel } from "./types";

/** Variant list for a single product, shown inside the variants dialog. */
export function ProductVariantTable({
  variants,
  canManage,
  onEdit,
  onDelete,
}: {
  variants: VariantRow[];
  canManage: boolean;
  onEdit: (variant: VariantRow) => void;
  onDelete: (variant: VariantRow) => void;
}) {
  if (variants.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No variants yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Size</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Shop</TableHead>
            <TableHead className="text-center">Godown</TableHead>
            <TableHead className="text-center">Total</TableHead>
            {canManage && (
              <TableHead className="w-[1%] text-right whitespace-nowrap">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => {
            const total = variantTotal(v);
            const low = total <= v.minStock;
            return (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.size}</TableCell>
                <TableCell>{v.color}</TableCell>
                <TableCell>
                  <Badge variant="outline">{sizeTypeLabel(v.sizeType)}</Badge>
                </TableCell>
                <TableCell className="text-center tabular-nums">{v.shopQty}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.godownQty}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={low ? "destructive" : "secondary"}>
                    {total}
                  </Badge>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${v.size} ${v.color}`}
                        onClick={() => onEdit(v)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${v.size} ${v.color}`}
                        onClick={() => onDelete(v)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
