"use client";

import { useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { purchaseOrderSchema } from "@/lib/validators/purchase-order";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PurchaseOrderItemRow } from "./purchase-order-item-form";
import {
  type PurchaseOrderRow,
  type SupplierOption,
  type VariantOption,
  formatMoney,
} from "./types";

// Form input/output types (coerced numbers differ between the two under Zod 4).
export type PoFormInput = z.input<typeof purchaseOrderSchema>;
type PoFormValues = z.output<typeof purchaseOrderSchema>;

interface ApiError {
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

const EMPTY_ITEM = { variantId: "", orderedQty: 1, unitPurchasePrice: 0 };

function defaultsFor(po: PurchaseOrderRow | null): PoFormInput {
  if (!po) {
    return {
      supplierId: "",
      expectedDate: "",
      note: "",
      isDraft: false,
      items: [{ ...EMPTY_ITEM }],
    };
  }
  return {
    supplierId: po.supplierId,
    expectedDate: po.expectedDate ? po.expectedDate.slice(0, 10) : "",
    note: po.note ?? "",
    isDraft: po.status === "DRAFT",
    items: po.items.map((i) => ({
      variantId: i.variantId,
      orderedQty: i.orderedQty,
      unitPurchasePrice: i.unitPurchasePrice,
    })),
  };
}

export function PurchaseOrderForm({
  open,
  onOpenChange,
  purchaseOrder,
  suppliers,
  variants,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrderRow | null;
  suppliers: SupplierOption[];
  variants: VariantOption[];
  onSaved: (po: PurchaseOrderRow) => void;
}) {
  const isEdit = !!purchaseOrder;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PoFormInput, unknown, PoFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: defaultsFor(purchaseOrder),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) reset(defaultsFor(purchaseOrder));
  }, [open, purchaseOrder, reset]);

  // Prefill a line's unit price with the variant's default purchase price.
  function handleVariantChange(index: number, variantId: string) {
    const opt = variants.find((v) => v.variantId === variantId);
    if (opt) setValue(`items.${index}.unitPurchasePrice`, opt.defaultPurchasePrice);
  }

  const watchedItems = watch("items");
  const runningTotal = (watchedItems ?? []).reduce(
    (sum, i) => sum + (Number(i.orderedQty) || 0) * (Number(i.unitPurchasePrice) || 0),
    0,
  );

  async function onSubmit(values: PoFormValues) {
    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: PurchaseOrderRow }>(
            `/purchase-orders/${purchaseOrder!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: PurchaseOrderRow }>(
            "/purchase-orders",
            values,
          );
      onSaved(res.data.data);
      toast.success(isEdit ? "Purchase order updated" : "Purchase order created");
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.message ?? "Could not save the purchase order.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit purchase order" : "New purchase order"}
            </DialogTitle>
            <DialogDescription>
              Choose a supplier and add the items you are ordering.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.supplierId}>
                <FieldLabel htmlFor="supplierId">Supplier</FieldLabel>
                <NativeSelect
                  id="supplierId"
                  className="w-full"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.supplierId}
                  {...register("supplierId")}
                >
                  <NativeSelectOption value="">Select supplier</NativeSelectOption>
                  {suppliers.map((s) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError
                  errors={errors.supplierId ? [errors.supplierId] : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="expectedDate">Expected date</FieldLabel>
                <Input
                  id="expectedDate"
                  type="date"
                  disabled={isSubmitting}
                  {...register("expectedDate")}
                />
              </Field>
            </div>

            {/* Items */}
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
                  <PurchaseOrderItemRow
                    key={row.id}
                    index={i}
                    variants={variants}
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
                <span className="text-muted-foreground">Order total:&nbsp;</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(runningTotal)}
                </span>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="po-note">Note</FieldLabel>
              <Textarea
                id="po-note"
                rows={2}
                placeholder="Optional note for this order"
                disabled={isSubmitting}
                {...register("note")}
              />
            </Field>

            <Controller
              control={control}
              name="isDraft"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FieldLabel htmlFor="isDraft">Save as draft</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Drafts can be edited and aren&apos;t ready to receive yet.
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
              {isEdit ? "Save changes" : "Create purchase order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
