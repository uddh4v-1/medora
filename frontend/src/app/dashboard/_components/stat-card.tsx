import { Card } from "@/components/ui/card";
import type { DashboardStat } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

const toneStyles: Record<DashboardStat["tone"], string> = {
  brand: "bg-brand/10 text-brand",
  coral: "bg-brand-coral/15 text-brand-coral",
  info: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = stat.icon;

  return (
    <Card className="flex flex-col gap-2.5 rounded-xl border-0 bg-card p-4 ring-1 ring-border shadow-card-soft dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {stat.label}
        </span>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md",
            toneStyles[stat.tone],
          )}
        >
          <Icon className="size-3" />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {stat.value}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {stat.caption}
        </span>
      </div>
    </Card>
  );
}
