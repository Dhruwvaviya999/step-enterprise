"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RANGE_LABELS,
  type RangeKey,
} from "@/lib/reports/date-range";

const PRESETS: RangeKey[] = ["today", "7d", "30d", "90d"];

export function DateRangeFilter({
  currentKey,
  from,
  to,
}: {
  currentKey: string;
  from: string; // ISO
  to: string; // ISO
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [customFrom, setCustomFrom] = useState(from.slice(0, 10));
  const [customTo, setCustomTo] = useState(to.slice(0, 10));

  function apply(params: Record<string, string>) {
    const sp = new URLSearchParams(params);
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPending && (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={currentKey === key ? "default" : "outline"}
            disabled={isPending}
            onClick={() => apply({ range: key })}
          >
            {RANGE_LABELS[key]}
          </Button>
        ))}

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant={currentKey === "custom" ? "default" : "outline"}
                disabled={isPending}
              />
            }
          >
            <CalendarDays className="size-4" />
            {currentKey === "custom" ? "Custom" : "Custom…"}
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
              disabled={isPending || !customFrom}
              onClick={() =>
                apply({ range: "custom", from: customFrom, to: customTo || customFrom })
              }
            >
              Apply range
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
