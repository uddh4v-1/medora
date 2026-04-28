"use client";

import { CheckCircle2, Clock, PlayCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatTone = "amber" | "sky" | "brand";

const toneStyles: Record<
  StatTone,
  { surface: string; iconBg: string; iconText: string; value: string }
> = {
  amber: {
    surface: "bg-card",
    iconBg: "bg-amber-500/12 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-300",
    value: "text-foreground",
  },
  sky: {
    surface: "bg-card",
    iconBg: "bg-sky-500/12 dark:bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-300",
    value: "text-foreground",
  },
  brand: {
    surface: "bg-card",
    iconBg: "bg-brand/10",
    iconText: "text-brand",
    value: "text-foreground",
  },
};

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  tone: StatTone;
}) {
  const styles = toneStyles[tone];
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border border-border p-4 shadow-card-soft dark:shadow-none",
        styles.surface,
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight",
            styles.value,
          )}
        >
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground">{caption}</span>
      </div>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          styles.iconBg,
          styles.iconText,
        )}
      >
        <Icon className="size-4" />
      </span>
    </div>
  );
}

export function QueueStats({
  waiting,
  inProgress,
  completed,
}: {
  waiting: number;
  inProgress: number;
  completed: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Waiting"
        value={waiting}
        caption="patients in line"
        icon={Clock}
        tone="amber"
      />
      <StatCard
        label="In progress"
        value={inProgress}
        caption="being seen now"
        icon={PlayCircle}
        tone="sky"
      />
      <StatCard
        label="Completed"
        value={completed}
        caption="visits today"
        icon={CheckCircle2}
        tone="brand"
      />
    </div>
  );
}
