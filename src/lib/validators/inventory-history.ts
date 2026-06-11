import { z } from "zod";
import { InventoryMovementType, StockLocation } from "@prisma/client";
import { startOfDay, endOfDay, subDays } from "date-fns";

// Date presets for the history view ("all" = no date bound).
export const HISTORY_RANGE_KEYS = [
  "all",
  "today",
  "7d",
  "30d",
  "90d",
  "custom",
] as const;
export type HistoryRangeKey = (typeof HISTORY_RANGE_KEYS)[number];

export const HISTORY_RANGE_LABELS: Record<HistoryRangeKey, string> = {
  all: "All time",
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  custom: "Custom",
};

// Lenient parse of raw search params — invalid values fall back rather than 422,
// since this only drives a read-only view.
export const historyParamsSchema = z.object({
  type: z.nativeEnum(InventoryMovementType).optional().catch(undefined),
  location: z.nativeEnum(StockLocation).optional().catch(undefined),
  productId: z.string().min(1).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  range: z.enum(HISTORY_RANGE_KEYS).catch("all"),
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});

export type HistoryParams = z.infer<typeof historyParamsSchema>;

function safeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Turn a range preset (or custom from/to) into optional date bounds. */
export function resolveHistoryWindow(params: HistoryParams): {
  from?: Date;
  to?: Date;
} {
  const now = new Date();
  switch (params.range) {
    case "all":
      return {};
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "90d":
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case "custom": {
      const from = safeDate(params.from);
      const to = safeDate(params.to);
      return {
        ...(from ? { from: startOfDay(from) } : {}),
        ...(to ? { to: endOfDay(to) } : {}),
      };
    }
  }
}
