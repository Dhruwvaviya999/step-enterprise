"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { variantSchema, type VariantInput } from "@/lib/validators/product";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { type VariantRow, SIZE_TYPE_OPTIONS } from "./types";

interface ApiError {
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

const EMPTY: VariantInput = {
  size: "",
  color: "",
  sizeType: "BIG",
  shopQty: 0,
  godownQty: 0,
  minStock: 5,
};

/**
 * Add/edit a single variant. `variant` null → create. Talks to the
 * /products/[productId]/variants endpoints and returns the saved variant.
 */
export function ProductVariantForm({
  open,
  onOpenChange,
  productId,
  variant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant: VariantRow | null;
  onSaved: (variant: VariantRow) => void;
}) {
  const isEdit = !!variant;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof variantSchema>, unknown, VariantInput>({
    resolver: zodResolver(variantSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      reset(
        variant
          ? {
              size: variant.size,
              color: variant.color,
              sizeType: variant.sizeType,
              shopQty: variant.shopQty,
              godownQty: variant.godownQty,
              minStock: variant.minStock,
            }
          : EMPTY,
      );
    }
  }, [open, variant, reset]);

  async function onSubmit(values: VariantInput) {
    try {
      const res = isEdit
        ? await axiosInstance.patch<{ data: VariantRow }>(
            `/products/${productId}/variants/${variant!.id}`,
            values,
          )
        : await axiosInstance.post<{ data: VariantRow }>(
            `/products/${productId}/variants`,
            values,
          );
      onSaved(res.data.data);
      toast.success(isEdit ? "Variant updated" : "Variant added");
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors) {
        let mapped = false;
        for (const key of ["size", "color", "shopQty", "godownQty", "minStock"] as const) {
          if (fieldErrors[key]?.[0]) {
            setError(key, { message: fieldErrors[key][0] });
            mapped = true;
          }
        }
        if (mapped) return;
      }
      toast.error(error.message ?? "Could not save the variant.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit variant" : "Add variant"}</DialogTitle>
            <DialogDescription>
              Size, color and size type identify the variant; stock is tracked
              per location.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field data-invalid={!!errors.size}>
                <FieldLabel htmlFor="v-size">Size</FieldLabel>
                <Input
                  id="v-size"
                  placeholder="7"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={!!errors.size}
                  {...register("size")}
                />
                <FieldError errors={errors.size ? [errors.size] : undefined} />
              </Field>

              <Field data-invalid={!!errors.color}>
                <FieldLabel htmlFor="v-color">Color</FieldLabel>
                <Input
                  id="v-color"
                  placeholder="Black"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.color}
                  {...register("color")}
                />
                <FieldError errors={errors.color ? [errors.color] : undefined} />
              </Field>

              <Field>
                <FieldLabel htmlFor="v-size-type">Size type</FieldLabel>
                <NativeSelect
                  id="v-size-type"
                  className="w-full"
                  disabled={isSubmitting}
                  {...register("sizeType")}
                >
                  {SIZE_TYPE_OPTIONS.map((o) => (
                    <NativeSelectOption key={o.value} value={o.value}>
                      {o.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field data-invalid={!!errors.shopQty}>
                <FieldLabel htmlFor="v-shop">Shop qty</FieldLabel>
                <Input
                  id="v-shop"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.shopQty}
                  {...register("shopQty")}
                />
                <FieldError errors={errors.shopQty ? [errors.shopQty] : undefined} />
              </Field>

              <Field data-invalid={!!errors.godownQty}>
                <FieldLabel htmlFor="v-godown">Godown qty</FieldLabel>
                <Input
                  id="v-godown"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.godownQty}
                  {...register("godownQty")}
                />
                <FieldError
                  errors={errors.godownQty ? [errors.godownQty] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.minStock}>
                <FieldLabel htmlFor="v-min">Min stock</FieldLabel>
                <Input
                  id="v-min"
                  type="number"
                  min={0}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.minStock}
                  {...register("minStock")}
                />
                <FieldError errors={errors.minStock ? [errors.minStock] : undefined} />
              </Field>
            </div>
          </FieldGroup>

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
              {isEdit ? "Save changes" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
