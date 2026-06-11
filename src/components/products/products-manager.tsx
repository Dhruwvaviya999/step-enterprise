"use client";

import { useMemo, useState } from "react";
import { Info, Package, Plus } from "lucide-react";
import { toast } from "sonner";

import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { ProductSearch } from "./product-search";
import {
  ProductFilter,
  EMPTY_FILTERS,
  type ProductFilters,
} from "./product-filter";
import { ProductTable } from "./product-table";
import { ProductForm } from "./product-form";
import { ProductVariantsDialog } from "./product-variants-dialog";
import {
  type Option,
  type ProductRow,
  type VariantRow,
  isLowStock,
  productTotalStock,
} from "./types";

interface ApiError {
  message?: string;
}

function searchText(p: ProductRow): string {
  return [
    p.articleNo,
    p.articleName,
    p.brandName ?? "",
    p.categoryName,
    ...p.variants.flatMap((v) => [v.size, v.color]),
  ]
    .join(" ")
    .toLowerCase();
}

export function ProductsManager({
  initialProducts,
  brands,
  categories,
  canManage,
}: {
  initialProducts: ProductRow[];
  brands: Option[];
  categories: Option[];
  canManage: boolean;
}) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const [variantsForId, setVariantsForId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !searchText(p).includes(q)) return false;
      if (filters.brandId && p.brandId !== filters.brandId) return false;
      if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
      if (filters.stock === "low" && !isLowStock(p)) return false;
      if (filters.stock === "in" && productTotalStock(p) <= 0) return false;
      if (filters.stock === "out" && productTotalStock(p) > 0) return false;
      return true;
    });
  }, [products, search, filters]);

  const selectedProduct = variantsForId
    ? products.find((p) => p.id === variantsForId) ?? null
    : null;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setFormOpen(true);
  }

  // Upsert the saved product (create appends, edit replaces).
  function handleSaved(saved: ProductRow) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const next = exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved];
      return next.sort((a, b) => a.articleName.localeCompare(b.articleName));
    });
  }

  // Apply a variant change from the variants dialog back into the product list.
  function handleVariantsChange(productId: string, variants: VariantRow[]) {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, variants } : p)),
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Product deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the product.");
    } finally {
      setDeleting(false);
    }
  }

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to products. Contact an administrator to
            make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ProductSearch value={search} onChange={setSearch} />
          {canManage && (
            <Button onClick={openCreate} className="sm:w-auto">
              <Plus className="size-4" />
              Add product
            </Button>
          )}
        </div>
        <ProductFilter
          brands={brands}
          categories={categories}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* Content */}
      {!hasProducts ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Add your first product and its variants to get started."
                : "No products have been added for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add product
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No products match your search or filters.
        </div>
      ) : (
        <ProductTable
          products={filtered}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onManageVariants={(p) => setVariantsForId(p.id)}
        />
      )}

      {/* Create / edit product */}
      {canManage && (
        <ProductForm
          open={formOpen}
          onOpenChange={setFormOpen}
          product={editing}
          brands={brands}
          categories={categories}
          onSaved={handleSaved}
        />
      )}

      {/* Variants */}
      <ProductVariantsDialog
        open={!!selectedProduct}
        onOpenChange={(o) => !o && setVariantsForId(null)}
        product={selectedProduct}
        canManage={canManage}
        onVariantsChange={handleVariantsChange}
      />

      {/* Delete product */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.articleName}
              </span>{" "}
              and all of its variants. This action cannot be undone.
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
    </div>
  );
}
