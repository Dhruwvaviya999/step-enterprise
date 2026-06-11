"use client";

import { useMemo, useState } from "react";
import { Info, Plus, ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TransferSearch } from "./transfer-search";
import { TransferTable } from "./transfer-table";
import { TransferForm } from "./transfer-form";
import { TransferDetailDialog } from "./transfer-detail-dialog";
import { type TransferRow, type VariantOption } from "./types";

export function TransfersManager({
  initialTransfers,
  variants,
  canManage,
}: {
  initialTransfers: TransferRow[];
  variants: VariantOption[];
  canManage: boolean;
}) {
  const [transfers, setTransfers] = useState<TransferRow[]>(initialTransfers);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<TransferRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transfers;
    return transfers.filter((t) =>
      [t.transferNo, t.articleNo, t.articleName, t.size, t.color]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [transfers, search]);

  function handleSaved(t: TransferRow) {
    setTransfers((prev) => [t, ...prev]);
  }

  const hasTransfers = transfers.length > 0;

  return (
    <div className="space-y-4">
      {!canManage && (
        <Alert>
          <Info />
          <AlertDescription>
            You have view-only access to stock transfers. Contact an administrator
            or manager to move stock.
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TransferSearch value={search} onChange={setSearch} />
        {canManage && variants.length > 0 && (
          <Button onClick={() => setFormOpen(true)} className="sm:w-auto">
            <Plus className="size-4" />
            New transfer
          </Button>
        )}
      </div>

      {/* Content */}
      {!hasTransfers ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowLeftRight />
            </EmptyMedia>
            <EmptyTitle>No transfers yet</EmptyTitle>
            <EmptyDescription>
              {canManage
                ? variants.length > 0
                  ? "Move stock between Shop and Godown to see transfers here."
                  : "Add products with variants first, then you can transfer stock."
                : "No stock transfers have been recorded for your company yet."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && variants.length > 0 && (
            <EmptyContent>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" />
                New transfer
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No transfers match your search.
        </div>
      ) : (
        <TransferTable transfers={filtered} onView={setDetailTarget} />
      )}

      {/* Create */}
      {canManage && (
        <TransferForm
          open={formOpen}
          onOpenChange={setFormOpen}
          variants={variants}
          onSaved={handleSaved}
        />
      )}

      {/* Detail (all roles) */}
      <TransferDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        transfer={detailTarget}
      />
    </div>
  );
}
