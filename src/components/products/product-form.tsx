"use client";

import { useEffect } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { productBaseSchema, variantSchema } from "@/lib/validators/product";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { type Option, type ProductRow, SIZE_TYPE_OPTIONS } from "./types";

// Form schema: variants are optional at the form level (only used in create
// mode); the server enforces "at least one variant" on create.
const formSchema = productBaseSchema.extend({
  variants: z.array(variantSchema),
});
// Coerced number fields make the schema's input type differ from its output
// (Zod 4: `z.coerce.number()` input is `unknown`), so we thread both through
// useForm: fields are typed by the input, resolved values by the output.
type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface ApiError {
  message?: string;
  data?: { errors?: Record<string, string[]> } | null;
}

const EMPTY_VARIANT = {
  size: "",
  color: "",
  sizeType: "BIG" as const,
  shopQty: 0,
  godownQty: 0,
  minStock: 5,
};

function defaultsFor(product: ProductRow | null): FormValues {
  if (!product) {
    return {
      articleNo: "",
      articleName: "",
      brandId: "",
      categoryId: "",
      sellingPrice: 0,
      defaultPurchasePrice: 0,
      isActive: true,
      variants: [{ ...EMPTY_VARIANT }],
    };
  }
  return {
    articleNo: product.articleNo,
    articleName: product.articleName,
    brandId: product.brandId ?? "",
    categoryId: product.categoryId,
    sellingPrice: product.sellingPrice,
    defaultPurchasePrice: product.defaultPurchasePrice,
    isActive: product.isActive,
    variants: [],
  };
}

/**
 * Create/edit a product. Create mode includes an inline variant builder (≥1);
 * edit mode edits product fields only (variants are managed separately).
 */
export function ProductForm({
  open,
  onOpenChange,
  product,
  brands,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  brands: Option[];
  categories: Option[];
  onSaved: (product: ProductRow) => void;
}) {
  const isEdit = !!product;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(product) as FormInput,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (open) reset(defaultsFor(product));
  }, [open, product, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (isEdit) {
        const { variants: _omit, ...base } = values;
        void _omit;
        const res = await axiosInstance.patch<{ data: ProductRow }>(
          `/products/${product!.id}`,
          base,
        );
        onSaved(res.data.data);
        toast.success("Product updated");
      } else {
        const res = await axiosInstance.post<{ data: ProductRow }>(
          "/products",
          values,
        );
        onSaved(res.data.data);
        toast.success("Product created");
      }
      onOpenChange(false);
    } catch (err) {
      const error = err as ApiError;
      const fieldErrors = error.data?.errors;
      if (fieldErrors?.articleNo?.[0]) {
        setError("articleNo", { message: fieldErrors.articleNo[0] });
        return;
      }
      toast.error(error.message ?? "Could not save the product.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this product's details."
                : "Create a product and its initial variants."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Article */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.articleNo}>
                <FieldLabel htmlFor="articleNo">Article no.</FieldLabel>
                <Input
                  id="articleNo"
                  placeholder="CR-001"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.articleNo}
                  {...register("articleNo")}
                />
                <FieldError
                  errors={errors.articleNo ? [errors.articleNo] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.articleName}>
                <FieldLabel htmlFor="articleName">Article name</FieldLabel>
                <Input
                  id="articleName"
                  placeholder="Crocs Classic"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.articleName}
                  {...register("articleName")}
                />
                <FieldError
                  errors={errors.articleName ? [errors.articleName] : undefined}
                />
              </Field>
            </div>

            {/* Brand + Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="brandId">Brand</FieldLabel>
                <NativeSelect
                  id="brandId"
                  className="w-full"
                  disabled={isSubmitting}
                  {...register("brandId")}
                >
                  <NativeSelectOption value="">No brand</NativeSelectOption>
                  {brands.map((b) => (
                    <NativeSelectOption key={b.id} value={b.id}>
                      {b.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                <NativeSelect
                  id="categoryId"
                  className="w-full"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.categoryId}
                  {...register("categoryId")}
                >
                  <NativeSelectOption value="">Select category</NativeSelectOption>
                  {categories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError
                  errors={errors.categoryId ? [errors.categoryId] : undefined}
                />
              </Field>
            </div>

            {/* Prices */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.sellingPrice}>
                <FieldLabel htmlFor="sellingPrice">Selling price</FieldLabel>
                <Input
                  id="sellingPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.sellingPrice}
                  {...register("sellingPrice")}
                />
                <FieldError
                  errors={errors.sellingPrice ? [errors.sellingPrice] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.defaultPurchasePrice}>
                <FieldLabel htmlFor="defaultPurchasePrice">
                  Default purchase price
                </FieldLabel>
                <Input
                  id="defaultPurchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.defaultPurchasePrice}
                  {...register("defaultPurchasePrice")}
                />
                <FieldError
                  errors={
                    errors.defaultPurchasePrice
                      ? [errors.defaultPurchasePrice]
                      : undefined
                  }
                />
              </Field>
            </div>

            {/* Active */}
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FieldLabel htmlFor="isActive">Active</FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      Inactive products are hidden from day-to-day operations.
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            />

            {/* Variant builder (create only) */}
            {!isEdit && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Variants</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => append({ ...EMPTY_VARIANT })}
                  >
                    <Plus className="size-4" />
                    Add row
                  </Button>
                </div>

                {typeof errors.variants?.message === "string" && (
                  <p className="text-sm text-destructive">
                    {errors.variants.message}
                  </p>
                )}

                <div className="space-y-2">
                  {fields.map((row, i) => (
                    <div key={row.id} className="rounded-md border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Variant {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove variant ${i + 1}`}
                          disabled={isSubmitting || fields.length === 1}
                          onClick={() => remove(i)}
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Size
                          </span>
                          <Input
                            placeholder="7"
                            aria-label="Size"
                            disabled={isSubmitting}
                            aria-invalid={!!errors.variants?.[i]?.size}
                            {...register(`variants.${i}.size`)}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Color
                          </span>
                          <Input
                            placeholder="Black"
                            aria-label="Color"
                            disabled={isSubmitting}
                            aria-invalid={!!errors.variants?.[i]?.color}
                            {...register(`variants.${i}.color`)}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Size type
                          </span>
                          <NativeSelect
                            className="w-full"
                            aria-label="Size type"
                            disabled={isSubmitting}
                            {...register(`variants.${i}.sizeType`)}
                          >
                            {SIZE_TYPE_OPTIONS.map((o) => (
                              <NativeSelectOption key={o.value} value={o.value}>
                                {o.label}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Shop qty
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            aria-label="Shop quantity"
                            disabled={isSubmitting}
                            {...register(`variants.${i}.shopQty`)}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Godown qty
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            aria-label="Godown quantity"
                            disabled={isSubmitting}
                            {...register(`variants.${i}.godownQty`)}
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Min stock
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="5"
                            aria-label="Minimum stock"
                            disabled={isSubmitting}
                            {...register(`variants.${i}.minStock`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Size + color + size type must be unique. You can add more
                  variants later.
                </p>
              </div>
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
              {isEdit ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
