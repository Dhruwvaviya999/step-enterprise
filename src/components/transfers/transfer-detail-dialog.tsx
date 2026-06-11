"use client";

import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type TransferRow, formatDate, locationLabel } from "./types";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function TransferDetailDialog({
  open,
  onOpenChange,
  transfer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: TransferRow | null;
}) {
  if (!transfer) return null;
  const t = transfer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.transferNo}</DialogTitle>
          <DialogDescription>Stock transfer details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="font-medium">{t.articleName}</p>
            <p className="text-xs text-muted-foreground">
              {t.articleNo} · {t.size} / {t.color}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <Badge variant="outline">{locationLabel(t.fromLocation)}</Badge>
            <ArrowRight className="size-4 text-muted-foreground" />
            <Badge variant="secondary">{locationLabel(t.toLocation)}</Badge>
            <span className="ml-2 font-semibold tabular-nums">× {t.quantity}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info label="Transferred by" value={t.createdByName ?? "—"} />
            <Info label="Date" value={formatDate(t.createdAt)} />
          </div>

          {t.note && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Note
              </p>
              <p className="text-sm">{t.note}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
