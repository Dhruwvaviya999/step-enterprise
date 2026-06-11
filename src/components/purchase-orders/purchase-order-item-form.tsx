"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { PoFormInput } from "./purchase-order-form";
import type { VariantOption } from "./types";

/**
 * One ordered line inside the purchase-order form. Presentational: it's wired
 * to the parent form's RHF field array via `register`, and tells the parent
 * when the variant changes so the unit price can be prefilled.
 */
export function PurchaseOrderItemRow({
  index,
  variants,
  register,
  errors,
  disabled,
  canRemove,
  onVariantChange,
  onRemove,
}: {
  index: number;
  variants: VariantOption[];
  register: UseFormRegister<PoFormInput>;
  errors: FieldErrors<PoFormInput>;
  disabled?: boolean;
  canRemove: boolean;
  onVariantChange: (index: number, variantId: string) => void;
  onRemove: () => void;
}) {
  const rowErrors = errors.items?.[index];
  const variantField = register(`items.${index}.variantId`);

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-[1fr_84px_110px_auto]">
      <div>
        <NativeSelect
          className="w-full"
          aria-label="Variant"
          disabled={disabled}
          aria-invalid={!!rowErrors?.variantId}
          {...variantField}
          onChange={(e) => {
            variantField.onChange(e);
            onVariantChange(index, e.target.value);
          }}
        >
          <NativeSelectOption value="">Select variant</NativeSelectOption>
          {variants.map((v) => (
            <NativeSelectOption key={v.variantId} value={v.variantId}>
              {v.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {rowErrors?.variantId && (
          <p className="mt-1 text-xs text-destructive">
            {rowErrors.variantId.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="number"
          min={1}
          placeholder="Qty"
          aria-label="Ordered quantity"
          disabled={disabled}
          aria-invalid={!!rowErrors?.orderedQty}
          {...register(`items.${index}.orderedQty`)}
        />
        {rowErrors?.orderedQty && (
          <p className="mt-1 text-xs text-destructive">
            {rowErrors.orderedQty.message}
          </p>
        )}
      </div>

      <div>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Unit price"
          aria-label="Unit purchase price"
          disabled={disabled}
          aria-invalid={!!rowErrors?.unitPurchasePrice}
          {...register(`items.${index}.unitPurchasePrice`)}
        />
        {rowErrors?.unitPurchasePrice && (
          <p className="mt-1 text-xs text-destructive">
            {rowErrors.unitPurchasePrice.message}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 justify-self-end text-muted-foreground hover:text-destructive"
        aria-label="Remove item"
        disabled={disabled || !canRemove}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
