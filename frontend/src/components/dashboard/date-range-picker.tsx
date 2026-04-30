"use client";

import { cn } from "@/lib/utils";

export type DateRange = { from: string; to: string };

type Preset = { label: string; key: string; days: number | null };

const PRESETS: Preset[] = [
  { label: "Today",   key: "today",  days: 0  },
  { label: "7 days",  key: "7d",     days: 6  },
  { label: "30 days", key: "30d",    days: 29 },
  { label: "3 months",key: "3m",     days: 89 },
  { label: "1 year",  key: "1y",     days: 364 },
];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function rangeFromPreset(key: string): DateRange {
  const today = new Date();
  const to = toIso(today);
  const preset = PRESETS.find((p) => p.key === key);
  if (!preset || preset.days === null) return { from: to, to };
  const from = new Date(today);
  from.setDate(from.getDate() - preset.days);
  return { from: toIso(from), to };
}

type Props = {
  value: string;
  onChange: (range: DateRange, key: string) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(rangeFromPreset(p.key), p.key)}
          className={cn(
            "h-7 rounded-md px-3 text-xs font-medium transition-colors",
            value === p.key
              ? "bg-brand text-brand-foreground shadow-brand"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
