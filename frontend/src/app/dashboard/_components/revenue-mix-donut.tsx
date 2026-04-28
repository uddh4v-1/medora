"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const PAID = "#2d5843";
const DUE = "#ea580c";

type Slice = { name: string; value: number; key: "paid" | "due" };

type Props = {
  collected: number;
  outstanding: number;
  className?: string;
};

export function RevenueMixDonut({ collected, outstanding, className }: Props) {
  const { t } = useI18n();
  const total = collected + outstanding;
  const recoveredPct =
    total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;

  const data: Slice[] = [
    { name: t("revenue.mixPaid"), value: collected, key: "paid" },
    { name: t("revenue.mixDue"), value: outstanding, key: "due" },
  ];

  if (total <= 0) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] flex-col justify-center rounded-2xl border border-border bg-card p-5 shadow-card-soft ring-1 ring-border/50 dark:shadow-none",
          className,
        )}
      >
        <h3 className="text-sm font-semibold text-foreground">
          {t("revenue.mixTitle")}
        </h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {t("revenue.mixSubtitle")}
        </p>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("revenue.mixEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col rounded-2xl border border-border bg-card p-4 pt-5 shadow-card-soft ring-1 ring-border/50 dark:shadow-none",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">
        {t("revenue.mixTitle")}
      </h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {t("revenue.mixSubtitle")}
      </p>

      <div className="relative mt-1 min-h-[200px] flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              <Cell key="paid" fill={PAID} />
              <Cell key="due" fill={DUE} />
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]!.payload as Slice;
                return (
                  <div className="rounded-lg border border-border bg-card px-2.5 py-2 text-xs shadow-md">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="tabular-nums text-muted-foreground">
                      {formatCurrency(p.value)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5"
          aria-hidden
        >
          <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {recoveredPct}%
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("revenue.mixCenterHint")}
          </span>
        </div>
      </div>

      <ul className="mt-1 flex flex-col gap-1.5 text-[11px]">
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 rounded-sm"
              style={{ background: PAID }}
            />
            {t("revenue.mixPaid")}
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(collected)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 rounded-sm"
              style={{ background: DUE }}
            />
            {t("revenue.mixDue")}
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {formatCurrency(outstanding)}
          </span>
        </li>
      </ul>
    </div>
  );
}
