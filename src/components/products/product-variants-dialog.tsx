"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductVariantTable } from "./product-variant-table";
import { ProductVariantForm } from "./product-variant-form";
import type { ProductRow, VariantRow } from "./types";

interface ApiError {
  message?: string;
}

/**
 * Manage the variants of one product. Controlled by the parent manager, which
 * owns the product list — every change is pushed up via `onVariantsChange` so
 * product totals and low-stock badges stay in sync.
 */
export function ProductVariantsDialog({
  open,
  onOpenChange,
  product,
  canManage,
  onVariantsChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  canManage: boolean;
  onVariantsChange: (productId: string, variants: VariantRow[]) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VariantRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VariantRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!product) return null;
  const variants = product.variants;

  const sortVariants = (list: VariantRow[]) =>
    [...list].sort(
      (a, b) => a.size.localeCompare(b.size) || a.color.localeCompare(b.color),
    );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(variant: VariantRow) {
    setEditing(variant);
    setFormOpen(true);
  }

  function handleSaved(saved: VariantRow) {
    const exists = variants.some((v) => v.id === saved.id);
    const next = exists
      ? variants.map((v) => (v.id === saved.id ? saved : v))
      : [...variants, saved];
    onVariantsChange(product!.id, sortVariants(next));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(
        `/products/${product!.id}/variants/${deleteTarget.id}`,
      );
      onVariantsChange(
        product!.id,
        variants.filter((v) => v.id !== deleteTarget.id),
      );
      toast.success("Variant deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the variant.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variants · {product.articleName}</DialogTitle>
            <DialogDescription>
              {product.articleNo} — manage size, color and stock per variant.
            </DialogDescription>
          </DialogHeader>

          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Add variant
              </Button>
            </div>
          )}

          <ProductVariantTable
            variants={variants}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </DialogContent>
      </Dialog>

      {/* Add / edit variant */}
      {canManage && (
        <ProductVariantForm
          open={formOpen}
          onOpenChange={setFormOpen}
          productId={product.id}
          variant={editing}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.size} · {deleteTarget?.color}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
