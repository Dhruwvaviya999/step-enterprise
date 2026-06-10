import { cn } from "@/lib/utils";

/** The Stocker bar-chart mark. Matches the PWA icon. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Stocker"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <rect x="7" y="18" width="3.5" height="7" rx="1" className="fill-background" />
      <rect x="12.5" y="13" width="3.5" height="12" rx="1" className="fill-background" />
      <rect x="18" y="15.5" width="3.5" height="9.5" rx="1" className="fill-background" />
      <rect x="23.5" y="7" width="3.5" height="18" rx="1" fill="#34d399" />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark className={markClassName} />
      <span className="text-lg font-semibold tracking-tight">Stocker</span>
    </div>
  );
}
