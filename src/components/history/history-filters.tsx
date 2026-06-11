"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HISTORY_RANGE_LABELS,
  type HistoryRangeKey,
} from "@/lib/validators/inventory-history";
import { MOVEMENT_TYPE_OPTIONS } from "./meta";

export interface HistoryFilterValues {
  type: string;
  location: string;
  productId: string;
  range: string;
  from: string;
  to: string;
}

export interface ProductOption {
  id: string;
  label: string;
}

const PRESETS: HistoryRangeKey[] = ["all", "today", "7d", "30d", "90d"];

export function HistoryFilters({
  values,
  products,
  onChange,
  onClear,
  hasActiveFilters,
}: {
  values: HistoryFilterValues;
  products: ProductOption[];
  onChange: (partial: Partial<HistoryFilterValues>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const [customFrom, setCustomFrom] = useState(values.from);
  const [customTo, setCustomTo] = useState(values.to);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        className="w-full sm:w-40"
        aria-label="Filter by movement type"
        value={values.type}
        onChange={(e) => onChange({ type: e.target.value })}
      >
        <NativeSelectOption value="">All types</NativeSelectOption>
        {MOVEMENT_TYPE_OPTIONS.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-full sm:w-32"
        aria-label="Filter by location"
        value={values.location}
        onChange={(e) => onChange({ location: e.target.value })}
      >
        <NativeSelectOption value="">All locations</NativeSelectOption>
        <NativeSelectOption value="SHOP">Shop</NativeSelectOption>
        <NativeSelectOption value="GODOWN">Godown</NativeSelectOption>
      </NativeSelect>

      <NativeSelect
        className="w-full sm:w-48"
        aria-label="Filter by product"
        value={values.productId}
        onChange={(e) => onChange({ productId: e.target.value })}
      >
        <NativeSelectOption value="">All products</NativeSelectOption>
        {products.map((p) => (
          <NativeSelectOption key={p.id} value={p.id}>
            {p.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={values.range === key ? "default" : "outline"}
            onClick={() => onChange({ range: key, from: "", to: "" })}
          >
            {HISTORY_RANGE_LABELS[key]}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant={values.range === "custom" ? "default" : "outline"}
              />
            }
          >
            <CalendarDays className="size-4" />
            Custom
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <p className="text-sm font-medium">Custom date range</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">From</span>
                <Input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </label>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={!customFrom && !customTo}
              onClick={() => onChange({ range: "custom", from: customFrom, to: customTo })}
            >
              Apply range
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onClear}
        >
          <X className="size-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
