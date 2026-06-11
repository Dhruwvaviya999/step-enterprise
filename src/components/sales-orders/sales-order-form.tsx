"use client";

import { useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { StockLocation } from "@prisma/client";

import { salesOrderSchema } from "@/lib/validators/sales-order";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { SalesOrderItemRow } from "./sales-order-item-form";
import {
  type SalesOrderRow,
  type VariantOption,
  formatMoney,
  variantAvailable,
} from "./types";

export type SoFormInput = z.input<typeof salesOrderSchema>;
type SoFormValues = z.output<typeof salesOrderSchema>;

interface ApiError {
  message?: string;
}

const EMPTY_ITEM = { variantId: "", quantity: 1, unitPrice: 0 };

function defaultsFor(so: SalesOrderRow | null): SoFormInput {
  if (!so) {
    return {
      location: StockLocation.SHOP,
      note: "",
      isDraft: false,
      items: [{ ...EMPTY_ITEM }],
    };
  }
  return {
    location: so.items[0]?.soldFrom ?? StockLocation.SHOP,
    note: so.note ?? "",
    isDraft: true,
    items: so.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

export function SalesOrderForm({
  open,
  onOpenChange,
  salesOrder,
  variants,
  canManage,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrderRow | null;
  variants: VariantOption[];
  /** Whether the user can save as draft (manage). Plain staff sell completed. */
  canManage: boolean;
  onSaved: (so: SalesOrderRow) => void;
}) {
  const isEdit = !!salesOrder;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SoFormInput, unknown, SoFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: defaultsFor(salesOrder),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) reset(defaultsFor(salesOrder));
  }, [open, salesOrder, reset]);

  function handleVariantChange(index: number, variantId: string) {
    const opt = variants.find((v) => v.variantId === variantId);
    if (opt) setValue(`items.${index}.unitPrice`, opt.sellingPrice);
  }

  const location = (watch("location") ?? StockLocation.SHOP) as StockLocation;
  const watchedItems = watch("items");
  const runningTotal = (watchedItems ?? []).reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  );

  async function onSubmit(values: SoFormValues) {
    // Client-side guard for the obvious oversell (server is authoritative).
    if (!values.isDraft) {
      const need = new Map<string, number>();
      for (const it of values.items)
        need.set(it.variantId, (need.get(it.variantId) ?? 0) + it.quantity);
      for (const [variantId, qty] of need) {
        const opt = variants.find((v) => v.variantId === variantId);
        if (opt && qty > variantAvailable(opt, values.location)) {
          toast.error(
            `Insufficient ${values.location} stock for ${opt.articleName} ${opt.size}/${opt.color}.`,
          );
          return;
        }
      }
    }

    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: SalesOrderRow }>(
            `/sales-orders/${salesOrder!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: SalesOrderRow }>(
            "/sales-orders",
            values,
          );
      onSaved(res.data.data);
      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not save the invoice.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit invoice" : "New sales invoice"}
            </DialogTitle>
            <DialogDescription>
              Add the product variants being sold. Stock is reduced when the
              invoice is completed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel htmlFor="so-location">Sell from</FieldLabel>
              <NativeSelect
                id="so-location"
                className="w-full sm:w-48"
                disabled={isSubmitting}
                {...register("location")}
              >
                <NativeSelectOption value="SHOP">Shop</NativeSelectOption>
                <NativeSelectOption value="GODOWN">Godown</NativeSelectOption>
              </NativeSelect>
            </Field>

            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Items</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => append({ ...EMPTY_ITEM })}
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              </div>

              {typeof errors.items?.message === "string" && (
                <p className="text-sm text-destructive">{errors.items.message}</p>
              )}

              <div className="space-y-2">
                {fields.map((row, i) => (
                  <SalesOrderItemRow
                    key={row.id}
                    index={i}
                    variants={variants}
                    location={location}
                    selectedVariantId={watchedItems?.[i]?.variantId ?? ""}
                    register={register}
                    errors={errors}
                    disabled={isSubmitting}
                    canRemove={fields.length > 1}
                    onVariantChange={handleVariantChange}
                    onRemove={() => remove(i)}
                  />
                ))}
              </div>

              <div className="flex justify-end pt-1 text-sm">
                <span className="text-muted-foreground">Invoice total:&nbsp;</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(runningTotal)}
                </span>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="so-note">Note</FieldLabel>
              <Textarea
                id="so-note"
                rows={2}
                placeholder="Optional note for this invoice"
                disabled={isSubmitting}
                {...register("note")}
              />
            </Field>

            {!isEdit && canManage && (
              <Controller
                control={control}
                name="isDraft"
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FieldLabel htmlFor="isDraft">Save as draft</FieldLabel>
                      <p className="text-xs text-muted-foreground">
                        Drafts don&apos;t reduce stock until completed.
                      </p>
                    </div>
                    <Switch
                      id="isDraft"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              />
            )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isEdit ? "Save changes" : "Create invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
