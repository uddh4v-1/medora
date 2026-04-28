"use client";

import { cn } from "@/lib/utils";

export type RankedItem = {
  id: string;
  label: string;
  value: number;
  /** Shown on the right; if omitted, uses `value` + `valueSuffix` */
  right?: string;
  /** Suffix when `right` is omitted (e.g. × for med counts) */
  valueSuffix?: string;
};

type Props = {
  items: RankedItem[];
  /** Accent: brand for meds, sky for doctors */
  accent?: "brand" | "sky";
  className?: string;
};

export function ReportsRankedBars({
  items,
  accent = "brand",
  className,
}: Props) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const barClass =
    accent === "sky"
      ? "bg-sky-500/90 dark:bg-sky-400/85"
      : "bg-brand";

  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((row, i) => {
        const pct = (row.value / max) * 100;
        return (
          <li key={row.id} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-foreground">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {i + 1}.
                </span>{" "}
                <span className="font-medium">{row.label}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground/90">
                {row.right != null
                  ? row.right
                  : `${row.value}${row.valueSuffix ?? "×"}`}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted/70 dark:bg-muted/40"
              role="presentation"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  barClass,
                )}
                style={{ width: `${Math.max(pct, 3)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
