"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { StockLocation } from "@prisma/client";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { SoFormInput } from "./sales-order-form";
import { type VariantOption, variantAvailable } from "./types";

/**
 * One sold line inside the sales-order form. Wired to the parent form's RHF
 * field array; shows the available stock for the selected variant + location.
 */
export function SalesOrderItemRow({
  index,
  variants,
  location,
  selectedVariantId,
  register,
  errors,
  disabled,
  canRemove,
  onVariantChange,
  onRemove,
}: {
  index: number;
  variants: VariantOption[];
  location: StockLocation;
  selectedVariantId: string;
  register: UseFormRegister<SoFormInput>;
  errors: FieldErrors<SoFormInput>;
  disabled?: boolean;
  canRemove: boolean;
  onVariantChange: (index: number, variantId: string) => void;
  onRemove: () => void;
}) {
  const rowErrors = errors.items?.[index];
  const variantField = register(`items.${index}.variantId`);
  const selected = variants.find((v) => v.variantId === selectedVariantId);
  const available = selected ? variantAvailable(selected, location) : null;

  return (
    <div className="space-y-1 rounded-md border p-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_110px_auto]">
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
            aria-label="Quantity"
            disabled={disabled}
            aria-invalid={!!rowErrors?.quantity}
            {...register(`items.${index}.quantity`)}
          />
          {rowErrors?.quantity && (
            <p className="mt-1 text-xs text-destructive">
              {rowErrors.quantity.message}
            </p>
          )}
        </div>

        <div>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Unit price"
            aria-label="Unit price"
            disabled={disabled}
            aria-invalid={!!rowErrors?.unitPrice}
            {...register(`items.${index}.unitPrice`)}
          />
          {rowErrors?.unitPrice && (
            <p className="mt-1 text-xs text-destructive">
              {rowErrors.unitPrice.message}
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

      {selected && (
        <p className="pl-1 text-xs text-muted-foreground">
          Available in {location === "SHOP" ? "Shop" : "Godown"}:{" "}
          <span className={available === 0 ? "text-destructive" : "font-medium"}>
            {available}
          </span>
        </p>
      )}
    </div>
  );
}
