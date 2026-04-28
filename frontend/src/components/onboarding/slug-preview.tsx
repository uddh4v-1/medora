"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  className?: string;
};

// Live preview of `medora.app/book/<slug>`. Shows a subtle coral check when
// the slug is non-empty (we treat any non-empty slug as available in this
// UI-only build — wire to GET /api/public/slug-available later).
export function SlugPreview({ slug, className }: Props) {
  const ready = slug.length > 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground ring-1 ring-border",
        className,
      )}
    >
      <span className="font-mono">medora.app/book/</span>
      <span
        className={cn(
          "font-mono font-medium",
          ready ? "text-brand-coral" : "text-muted-foreground/70",
        )}
      >
        {slug || "your-clinic"}
      </span>
      {ready && (
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-brand-coral">
          <Check className="size-3" />
          available
        </span>
      )}
    </div>
  );
}
