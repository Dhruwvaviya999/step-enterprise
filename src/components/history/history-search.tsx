"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Debounced search box. Holds local text and only pushes the committed value
 * up (which the parent turns into a URL change) after a short pause.
 */
export function HistorySearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [text, setText] = useState(value);
  const first = useRef(true);

  // Keep in sync when the URL value changes externally (e.g. Clear).
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      if (text !== value) onChange(text);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search product, variant, reference…"
        className="pl-9 pr-9"
        aria-label="Search inventory history"
      />
      {text && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            onChange("");
          }}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
