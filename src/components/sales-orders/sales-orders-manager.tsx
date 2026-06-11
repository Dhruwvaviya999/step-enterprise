"use client";

import { useMemo, useState } from "react";
import { Info, Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { SalesOrderStatus } from "@prisma/client";

import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import { SalesOrderSearch } from "./sales-order-search";
import { SalesOrderTable } from "./sales-order-table";
import { SalesOrderForm } from "./sales-order-form";
import { SalesOrderDetailDialog } from "./sales-order-detail-dialog";
import { type SalesOrderRow, type VariantOption } from "./types";

interface ApiError {
  message?: string;
}

const STATUS_VALUES = Object.values(SalesOrderStatus);

export function SalesOrdersManager({
  initialOrders,
  variants,
  canCreate,
  canManage,
}: {
  initialOrders: SalesOrderRow[];
  variants: VariantOption[];
  canCreate: boolean;
  canManage: boolean;
}) {
  const [orders, setOrders] = useState<SalesOrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | SalesOrderStatus>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SalesOrderRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<SalesOrderRow | null>(null);

  const [completeTarget, setCompleteTarget] = useState<SalesOrderRow | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SalesOrderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesOrderRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((so) => {
      if (statusFilter && so.status !== statusFilter) return false;
      if (!q) return true;
      return so.invoiceNo.toLowerCase().includes(q);
    });
  }, [orders, search, statusFilter]);

  function upsert(so: SalesOrderRow) {
    setOrders((prev) => {
      const exists = prev.some((p) => p.id === so.id);
      return exists ? prev.map((p) => (p.id === so.id ? so : p)) : [so, ...prev];
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(so: SalesOrderRow) {
    setEditing(so);
    setFormOpen(true);
  }

  async function patchAction(
    so: SalesOrderRow,
    body: Record<string, unknown>,
    successMsg: string,
    onDone: () => void,
  ) {
    setBusy(true);
    try {
      const res = await axiosInstance.patch<{ data: SalesOrderRow }>(
        `/sales-orders/${so.id}`,
        body,
      );
      upsert(res.data.data);
      toast.success(successMsg);
      onDone();
    } catch (err) {
      toast.error((err as ApiError).message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await axiosInstance.delete(`/sales-orders/${deleteTarget.id}`);
      setOrders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Invoice deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the invoice.");
    } finally {
      setBusy(false);
    }
  }

  const hasOrders = orders.length > 0;

  return (
    <div className="space-y-4">
      {!canCreate && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to sales orders.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SalesOrderSearch value={search} onChange={setSearch} />
          <NativeSelect
            className="w-full sm:w-40"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | SalesOrderStatus)
            }
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {STATUS_VALUES.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="sm:w-auto">
            <Plus className="size-4" />
            New invoice
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasOrders ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>No sales yet</EmptyTitle>
            <EmptyDescription>
              {canCreate
                ? "Create your first sales invoice to record a sale."
                : "No sales orders have been recorded for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canCreate && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New invoice
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No invoices match your search or filter.
        </div>
      ) : (
        <SalesOrderTable
          orders={filtered}
          canManage={canManage}
          onView={setDetailTarget}
          onComplete={setCompleteTarget}
          onEdit={openEdit}
          onCancel={setCancelTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / edit */}
      {canCreate && (
        <SalesOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          salesOrder={editing}
          variants={variants}
          canManage={canManage}
          onSaved={upsert}
        />
      )}

      {/* Detail (all roles) */}
      <SalesOrderDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        salesOrder={detailTarget}
      />

      {/* Complete confirmation */}
      <AlertDialog
        open={!!completeTarget}
        onOpenChange={(o) => !o && setCompleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              {completeTarget?.invoiceNo} will be finalised and stock reduced
              accordingly. This can be reversed by cancelling the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() =>
                completeTarget &&
                patchAction(
                  completeTarget,
                  { complete: true },
                  "Sale completed",
                  () => setCompleteTarget(null),
                )
              }
            >
              {busy && <Spinner />}
              Complete sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.invoiceNo} will be marked cancelled.
              {cancelTarget?.status === "COMPLETED"
                ? " The sold stock will be returned to inventory."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep invoice</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() =>
                cancelTarget &&
                patchAction(
                  cancelTarget,
                  { cancel: true },
                  "Invoice cancelled",
                  () => setCancelTarget(null),
                )
              }
            >
              {busy && <Spinner />}
              Cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.invoiceNo}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={confirmDelete}
            >
              {busy && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
