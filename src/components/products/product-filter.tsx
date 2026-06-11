"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { Option } from "./types";

export type StockFilter = "all" | "low" | "in" | "out";

export interface ProductFilters {
  brandId: string; // "" = all
  categoryId: string; // "" = all
  stock: StockFilter;
}

export const EMPTY_FILTERS: ProductFilters = {
  brandId: "",
  categoryId: "",
  stock: "all",
};

export function ProductFilter({
  brands,
  categories,
  filters,
  onChange,
}: {
  brands: Option[];
  categories: Option[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
}) {
  const isActive =
    filters.brandId !== "" || filters.categoryId !== "" || filters.stock !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        className="w-full sm:w-40"
        aria-label="Filter by brand"
        value={filters.brandId}
        onChange={(e) => onChange({ ...filters, brandId: e.target.value })}
      >
        <NativeSelectOption value="">All brands</NativeSelectOption>
        {brands.map((b) => (
          <NativeSelectOption key={b.id} value={b.id}>
            {b.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-full sm:w-40"
        aria-label="Filter by category"
        value={filters.categoryId}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
      >
        <NativeSelectOption value="">All categories</NativeSelectOption>
        {categories.map((c) => (
          <NativeSelectOption key={c.id} value={c.id}>
            {c.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-full sm:w-36"
        aria-label="Filter by stock"
        value={filters.stock}
        onChange={(e) =>
          onChange({ ...filters, stock: e.target.value as StockFilter })
        }
      >
        <NativeSelectOption value="all">All stock</NativeSelectOption>
        <NativeSelectOption value="low">Low stock</NativeSelectOption>
        <NativeSelectOption value="in">In stock</NativeSelectOption>
        <NativeSelectOption value="out">Out of stock</NativeSelectOption>
      </NativeSelect>

      {isActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
