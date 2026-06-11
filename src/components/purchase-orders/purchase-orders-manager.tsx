"use client";

import { useMemo, useState } from "react";
import { Info, Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { PurchaseOrderStatus } from "@prisma/client";

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
import { PurchaseOrderSearch } from "./purchase-order-search";
import { PurchaseOrderTable } from "./purchase-order-table";
import { PurchaseOrderForm } from "./purchase-order-form";
import { ReceiveStockDialog } from "./receive-stock-dialog";
import { PurchaseOrderDetailDialog } from "./purchase-order-detail-dialog";
import {
  type PurchaseOrderRow,
  type SupplierOption,
  type VariantOption,
} from "./types";

interface ApiError {
  message?: string;
}

const STATUS_VALUES = Object.values(PurchaseOrderStatus);

export function PurchaseOrdersManager({
  initialOrders,
  suppliers,
  variants,
  canManage,
}: {
  initialOrders: PurchaseOrderRow[];
  suppliers: SupplierOption[];
  variants: VariantOption[];
  canManage: boolean;
}) {
  const [orders, setOrders] = useState<PurchaseOrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | PurchaseOrderStatus>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrderRow | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrderRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<PurchaseOrderRow | null>(null);

  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((po) => {
      if (statusFilter && po.status !== statusFilter) return false;
      if (!q) return true;
      return (
        po.orderNo.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  function upsert(po: PurchaseOrderRow) {
    setOrders((prev) => {
      const exists = prev.some((p) => p.id === po.id);
      return exists ? prev.map((p) => (p.id === po.id ? po : p)) : [po, ...prev];
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(po: PurchaseOrderRow) {
    setEditing(po);
    setFormOpen(true);
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const res = await axiosInstance.patch<{ data: PurchaseOrderRow }>(
        `/purchase-orders/${cancelTarget.id}`,
        { cancel: true },
      );
      upsert(res.data.data);
      toast.success("Purchase order cancelled");
      setCancelTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not cancel the order.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await axiosInstance.delete(`/purchase-orders/${deleteTarget.id}`);
      setOrders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Purchase order deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not delete the order.");
    } finally {
      setBusy(false);
    }
  }

  const hasOrders = orders.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to purchase orders. Contact an administrator
            or manager to make changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PurchaseOrderSearch value={search} onChange={setSearch} />
          <NativeSelect
            className="w-full sm:w-40"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | PurchaseOrderStatus)
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
        {canManage && (
          <Button onClick={openCreate} className="sm:w-auto">
            <Plus className="size-4" />
            New purchase order
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasOrders ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No purchase orders yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? "Create a purchase order to start ordering stock from suppliers."
                : "No purchase orders have been created for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New purchase order
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No purchase orders match your search or filter.
        </div>
      ) : (
        <PurchaseOrderTable
          orders={filtered}
          canManage={canManage}
          onView={setDetailTarget}
          onReceive={setReceiveTarget}
          onEdit={openEdit}
          onCancel={setCancelTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {/* Create / edit */}
      {canManage && (
        <PurchaseOrderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          purchaseOrder={editing}
          suppliers={suppliers}
          variants={variants}
          onSaved={upsert}
        />
      )}

      {/* Receive */}
      {canManage && (
        <ReceiveStockDialog
          open={!!receiveTarget}
          onOpenChange={(o) => !o && setReceiveTarget(null)}
          purchaseOrder={receiveTarget}
          onReceived={upsert}
        />
      )}

      {/* Detail (all roles) */}
      <PurchaseOrderDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        purchaseOrder={detailTarget}
      />

      {/* Cancel confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel purchase order?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.orderNo} will be marked as cancelled. Any stock
              already received stays in inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={confirmCancel}
            >
              {busy && <Spinner />}
              Cancel order
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
            <AlertDialogTitle>Delete purchase order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.orderNo}
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
