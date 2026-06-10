"use client";

import * as React from "react";
import { Building2, ImageUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Logo picker for the company settings form.
 *
 * It does not upload on its own — it reads the chosen file into a base64 data
 * URI and hands it to `onChange`, which the form submits. The settings API then
 * uploads that data URI to Cloudinary server-side. `value` may be an existing
 * Cloudinary URL, a data URI preview, or "" when no logo is set.
 */
export function CompanyLogoUploader({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Use a PNG, JPG, WEBP or SVG image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => toast.error("Could not read that file.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted",
          disabled && "opacity-60",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Company logo"
            className="size-full object-contain"
          />
        ) : (
          <Building2 className="size-7 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp className="size-4" />
            {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange("")}
            >
              <X className="size-4" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP or SVG · up to 2 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // allow re-picking the same file
        }}
      />
    </div>
  );
}
