import { startOfDay, endOfDay, subDays } from "date-fns";

// Presets the UI offers, plus a free custom range.
export const RANGE_KEYS = ["today", "7d", "30d", "90d", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

export interface DateWindow {
  key: RangeKey;
  from: Date;
  to: Date;
}

function safeDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Resolve a date window from raw search-param values. Falls back to the last 30
 * days for anything missing or invalid. All windows are inclusive day bounds.
 */
export function resolveWindow(params: {
  range?: string;
  from?: string;
  to?: string;
}): DateWindow {
  const key: RangeKey = (RANGE_KEYS as readonly string[]).includes(
    params.range ?? "",
  )
    ? (params.range as RangeKey)
    : "30d";

  const now = new Date();
  const to = endOfDay(now);

  if (key === "custom") {
    const customFrom = safeDate(params.from);
    if (customFrom) {
      const customTo = safeDate(params.to);
      return {
        key,
        from: startOfDay(customFrom),
        to: customTo ? endOfDay(customTo) : to,
      };
    }
    // Custom with no/invalid start → behave like 30d.
    return { key, from: startOfDay(subDays(now, 29)), to };
  }

  switch (key) {
    case "today":
      return { key, from: startOfDay(now), to };
    case "7d":
      return { key, from: startOfDay(subDays(now, 6)), to };
    case "90d":
      return { key, from: startOfDay(subDays(now, 89)), to };
    case "30d":
    default:
      return { key, from: startOfDay(subDays(now, 29)), to };
  }
}
