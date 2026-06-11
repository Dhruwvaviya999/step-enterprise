"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { StockLocation } from "@prisma/client";

import { transferSchema } from "@/lib/validators/transfer";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  type TransferRow,
  type VariantOption,
  variantAvailable,
  locationLabel,
} from "./types";

type TransferFormInput = z.input<typeof transferSchema>;
type TransferFormValues = z.output<typeof transferSchema>;

interface ApiError {
  message?: string;
}

const DEFAULTS: TransferFormInput = {
  variantId: "",
  fromLocation: StockLocation.GODOWN,
  toLocation: StockLocation.SHOP,
  quantity: 1,
  note: "",
};

export function TransferForm({
  open,
  onOpenChange,
  variants,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: VariantOption[];
  onSaved: (transfer: TransferRow) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) reset(DEFAULTS);
  }, [open, reset]);

  const variantId = watch("variantId");
  const fromLocation = (watch("fromLocation") ?? StockLocation.GODOWN) as StockLocation;
  const toLocation = (watch("toLocation") ?? StockLocation.SHOP) as StockLocation;
  const selected = variants.find((v) => v.variantId === variantId);
  const available = selected ? variantAvailable(selected, fromLocation) : null;

  function swap() {
    setValue("fromLocation", toLocation);
    setValue("toLocation", fromLocation);
  }

  async function onSubmit(values: TransferFormValues) {
    const opt = variants.find((v) => v.variantId === values.variantId);
    if (opt && values.quantity > variantAvailable(opt, values.fromLocation)) {
      toast.error(
        `Insufficient ${values.fromLocation} stock for ${opt.articleName} ${opt.size}/${opt.color}.`,
      );
      return;
    }
    try {
      const res = await axiosInstance.post<{ data: TransferRow }>(
        "/transfers",
        values,
      );
      onSaved(res.data.data);
      toast.success("Stock transferred");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as ApiError).message ?? "Could not create the transfer.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>New stock transfer</DialogTitle>
            <DialogDescription>
              Move a variant&apos;s stock between Shop and Godown.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Field data-invalid={!!errors.variantId}>
              <FieldLabel htmlFor="t-variant">Variant</FieldLabel>
              <NativeSelect
                id="t-variant"
                className="w-full"
                disabled={isSubmitting}
                aria-invalid={!!errors.variantId}
                {...register("variantId")}
              >
                <NativeSelectOption value="">Select variant</NativeSelectOption>
                {variants.map((v) => (
                  <NativeSelectOption key={v.variantId} value={v.variantId}>
                    {v.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={errors.variantId ? [errors.variantId] : undefined}
              />
            </Field>

            {/* From → To */}
            <div className="flex items-end gap-2">
              <Field className="flex-1">
                <FieldLabel htmlFor="t-from">From</FieldLabel>
                <NativeSelect
                  id="t-from"
                  className="w-full"
                  disabled={isSubmitting}
                  {...register("fromLocation")}
                >
                  <NativeSelectOption value="GODOWN">Godown</NativeSelectOption>
                  <NativeSelectOption value="SHOP">Shop</NativeSelectOption>
                </NativeSelect>
              </Field>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mb-0.5 shrink-0"
                aria-label="Swap locations"
                disabled={isSubmitting}
                onClick={swap}
              >
                <ArrowLeftRight className="size-4" />
              </Button>

              <Field className="flex-1" data-invalid={!!errors.toLocation}>
                <FieldLabel htmlFor="t-to">To</FieldLabel>
                <NativeSelect
                  id="t-to"
                  className="w-full"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.toLocation}
                  {...register("toLocation")}
                >
                  <NativeSelectOption value="SHOP">Shop</NativeSelectOption>
                  <NativeSelectOption value="GODOWN">Godown</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            {errors.toLocation && (
              <p className="text-sm text-destructive">{errors.toLocation.message}</p>
            )}

            <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 p-2 text-sm">
              <span className="font-medium">{locationLabel(fromLocation)}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="font-medium">{locationLabel(toLocation)}</span>
            </div>

            <Field data-invalid={!!errors.quantity}>
              <FieldLabel htmlFor="t-qty">Quantity</FieldLabel>
              <Input
                id="t-qty"
                type="number"
                min={1}
                disabled={isSubmitting}
                aria-invalid={!!errors.quantity}
                {...register("quantity")}
              />
              <FieldError
                errors={errors.quantity ? [errors.quantity] : undefined}
              />
              {selected && (
                <p className="text-xs text-muted-foreground">
                  Available in {locationLabel(fromLocation)}:{" "}
                  <span
                    className={available === 0 ? "text-destructive" : "font-medium"}
                  >
                    {available}
                  </span>
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="t-note">Note</FieldLabel>
              <Textarea
                id="t-note"
                rows={2}
                placeholder="Optional note for this transfer"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Transfer stock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
