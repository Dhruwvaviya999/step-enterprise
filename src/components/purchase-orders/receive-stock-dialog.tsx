"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";

import { receiveStockSchema } from "@/lib/validators/purchase-order";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { type PurchaseOrderRow, itemPending } from "./types";

type ReceiveInput = z.input<typeof receiveStockSchema>;
type ReceiveValues = z.output<typeof receiveStockSchema>;

interface ApiError {
  message?: string;
}

export function ReceiveStockDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onReceived,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrderRow | null;
  onReceived: (po: PurchaseOrderRow) => void;
}) {
  // Only lines with something still pending can be received.
  const pendingItems = useMemo(
    () => (purchaseOrder ? purchaseOrder.items.filter((i) => itemPending(i) > 0) : []),
    [purchaseOrder],
  );

  const buildDefaults = (): ReceiveInput => ({
    location: "GODOWN",
    note: "",
    lines: pendingItems.map((i) => ({ itemId: i.id, receiveQty: itemPending(i) })),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReceiveInput, unknown, ReceiveValues>({
    resolver: zodResolver(receiveStockSchema),
    defaultValues: buildDefaults(),
  });

  const { fields } = useFieldArray({ control, name: "lines" });

  useEffect(() => {
    if (open) reset(buildDefaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purchaseOrder]);

  async function onSubmit(values: ReceiveValues) {
    if (!purchaseOrder) return;
    try {
      const res = await axiosInstance.post<{ data: PurchaseOrderRow }>(
        `/purchase-orders/${purchaseOrder.id}/receive`,
        values,
      );
      onReceived(res.data.data);
      toast.success("Stock received");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not receive stock.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Receive stock · {purchaseOrder?.orderNo}</DialogTitle>
            <DialogDescription>
              Enter the quantity received for each line. Leave 0 to skip a line.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="receive-location">Receive into</FieldLabel>
              <NativeSelect
                id="receive-location"
                className="w-full sm:w-48"
                disabled={isSubmitting}
                {...register("location")}
              >
                <NativeSelectOption value="GODOWN">Godown</NativeSelectOption>
                <NativeSelectOption value="SHOP">Shop</NativeSelectOption>
              </NativeSelect>
            </Field>

            {pendingItems.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing left to receive on this order.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[1fr_64px_64px_84px] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Item</span>
                  <span className="text-center">Ord.</span>
                  <span className="text-center">Pend.</span>
                  <span className="text-center">Receive</span>
                </div>
                {fields.map((row, i) => {
                  const item = pendingItems[i];
                  const pending = itemPending(item);
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_64px_64px_84px] items-center gap-2 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.articleName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <span className="text-center tabular-nums text-muted-foreground">
                        {item.orderedQty}
                      </span>
                      <span className="text-center tabular-nums">{pending}</span>
                      <Input
                        type="number"
                        min={0}
                        max={pending}
                        className="h-8 text-center"
                        aria-label={`Receive ${item.articleName}`}
                        disabled={isSubmitting}
                        {...register(`lines.${i}.receiveQty`)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="receive-note">Note</FieldLabel>
              <Textarea
                id="receive-note"
                rows={2}
                placeholder="Optional note for this receipt"
                disabled={isSubmitting}
                {...register("note")}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pendingItems.length === 0}
            >
              {isSubmitting && <Spinner />}
              Receive stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
