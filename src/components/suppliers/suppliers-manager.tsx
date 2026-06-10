"use client";

import { useMemo, useState } from "react";
import { Info, Plus, Truck } from "lucide-react";
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
import { SupplierSearch } from "./supplier-search";
import { SupplierForm } from "./supplier-form";
import { SupplierTable, type Supplier } from "./supplier-table";

interface ApiError {
  message?: string;
}

const byName = (a: Supplier, b: Supplier) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

export function SuppliersManager({
  initialSuppliers,
  canManage,
}: {
  initialSuppliers: Supplier[];
  canManage: boolean;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Small list → filter locally by name for instant search (API also supports it).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? suppliers.filter((s) => s.name.toLowerCase().includes(q))
      : suppliers;
    return [...list].sort(byName);
  }, [suppliers, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setFormOpen(true);
  }

  // Insert or replace the saved supplier, keeping the list sorted.
  function handleSaved(saved: Supplier) {
    setSuppliers((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      const next = exists
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved];
      return next.sort(byName);
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/suppliers/${deleteTarget.id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Supplier deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the supplier.");
    } finally {
      setDeleting(false);
    }
  }

  const hasSuppliers = suppliers.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to suppliers. Contact an administrator to
            make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SupplierSearch value={search} onChange={setSearch} />
        {canManage && (
          <Button onClick={openCreate} className="sm:w-auto">
            <Plus className="size-4" />
            Add supplier
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasSuppliers ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Truck />
            </EmptyMedia>
            <EmptyTitle>No suppliers yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Add your first supplier to get started."
                : "No suppliers have been added for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Add supplier
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No suppliers match “{search}”.
        </div>
      ) : (
        <SupplierTable
          suppliers={filtered}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / edit dialog */}
      {canManage && (
        <SupplierForm
          open={formOpen}
          onOpenChange={setFormOpen}
          supplier={editing}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
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
    </div>
  );
}
