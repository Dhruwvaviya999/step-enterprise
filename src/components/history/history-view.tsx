"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, History as HistoryIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { HistoryResult } from "@/lib/actions/inventory-history";
import { HistorySearch } from "./history-search";
import {
  HistoryFilters,
  type HistoryFilterValues,
  type ProductOption,
} from "./history-filters";
import { HistorySummary } from "./history-summary";
import { HistoryTable } from "./history-table";
import { formatNumber } from "./meta";

export function HistoryView({
  data,
  products,
  current,
}: {
  data: HistoryResult;
  products: ProductOption[];
  current: HistoryFilterValues & { q: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function apply(
    partial: Record<string, string>,
    opts: { resetPage?: boolean } = {},
  ) {
    const { resetPage = true } = opts;
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(partial)) {
      const isDefault = value === "" || (key === "range" && value === "all");
      if (isDefault) params.delete(key);
      else params.set(key, value);
    }
    if (resetPage) params.delete("page");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  const hasActiveFilters =
    !!current.type ||
    !!current.location ||
    !!current.productId ||
    !!current.q ||
    current.range !== "all";

  function clearAll() {
    apply({
      type: "",
      location: "",
      productId: "",
      q: "",
      range: "all",
      from: "",
      to: "",
    });
  }

  const { page, pageCount, total, pageSize, items } = data;
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <HistorySearch value={current.q} onChange={(q) => apply({ q })} />
          {isPending && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Updating…
            </span>
          )}
        </div>
        <HistoryFilters
          values={current}
          products={products}
          onChange={(partial) =>
            apply(partial as Record<string, string>)
          }
          onClear={clearAll}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <HistorySummary summary={data.summary} />

      {items.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>No movements found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "No inventory movements match your search or filters."
                : "Inventory movements from purchases, sales and transfers will appear here."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <HistoryTable items={items} />

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {formatNumber(firstRow)}–{formatNumber(lastRow)}
              </span>{" "}
              of <span className="font-medium text-foreground">{formatNumber(total)}</span>
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isPending}
                  onClick={() => apply({ page: String(page - 1) }, { resetPage: false })}
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Page {page} of {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount || isPending}
                  onClick={() => apply({ page: String(page + 1) }, { resetPage: false })}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
