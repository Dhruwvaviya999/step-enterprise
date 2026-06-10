"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

function Muted({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground/50">—</span>;
  return <span>{value}</span>;
}

/**
 * Presentational supplier table. All state and mutations live in the parent
 * manager; this component just renders rows and surfaces edit/delete intents.
 * Horizontally scrolls on small screens so the contact columns stay readable.
 */
export function SupplierTable({
  suppliers,
  canManage,
  onEdit,
  onDelete,
}: {
  suppliers: Supplier[];
  canManage: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            {canManage && (
              <TableHead className="w-[1%] text-right whitespace-nowrap">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">
                <Muted value={supplier.phone} />
              </TableCell>
              <TableCell>
                <Muted value={supplier.email} />
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground">
                <Muted value={supplier.address} />
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${supplier.name}`}
                      onClick={() => onEdit(supplier)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${supplier.name}`}
                      onClick={() => onDelete(supplier)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
