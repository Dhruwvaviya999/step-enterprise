"use client";

import { Layers, Pencil, Trash2 } from "lucide-react";

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
import {
  type ProductRow,
  isLowStock,
  productTotalStock,
} from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function ProductTable({
  products,
  canManage,
  onEdit,
  onDelete,
  onManageVariants,
}: {
  products: ProductRow[];
  canManage: boolean;
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
  onManageVariants: (product: ProductRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Article</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Selling price</TableHead>
            <TableHead className="text-center">Variants</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[1%] text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const total = productTotalStock(p);
            const low = isLowStock(p);
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.articleName}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {p.articleNo}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.brandName ?? <span className="text-muted-foreground/50">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {p.categoryName}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {inr.format(p.sellingPrice)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5"
                    onClick={() => onManageVariants(p)}
                  >
                    <Layers className="size-3.5" />
                    {p.variants.length}
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={low ? "destructive" : "secondary"}>
                    {total}
                    {low ? " · low" : ""}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? "default" : "outline"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canManage ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${p.articleName}`}
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${p.articleName}`}
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
