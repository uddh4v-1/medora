"use client";

import {
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import {
  formatCurrency,
  revenueFromPaidInvoicesLast7Days,
  sumPaidPreviousSevenDays,
} from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";

import { DashboardPageHeader } from "../../_components/page-header";
import { RevenueChart } from "../../_components/revenue-chart";
import { RevenueMixDonut } from "../../_components/revenue-mix-donut";

export function RevenueOverview() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const invoices = useClinicStore((s) => s.invoices);

  const series = useMemo(
    () => revenueFromPaidInvoicesLast7Days(invoices),
    [invoices],
  );
  const totalThisWeek = useMemo(
    () => series.reduce((acc, p) => acc + p.value, 0),
    [series],
  );
  const totalToday = series.at(-1)?.value ?? 0;
  const priorWeekPaid = useMemo(
    () => sumPaidPreviousSevenDays(invoices),
    [invoices],
  );
  const paid = invoices.filter((inv) => inv.status === "paid");
  const unpaid = invoices.filter((inv) => inv.status === "unpaid");
  const collected = paid.reduce((acc, inv) => acc + inv.total, 0);
  const outstanding = unpaid.reduce((acc, inv) => acc + inv.total, 0);

  const paidCaption =
    paid.length === 1
      ? t("revenue.paidOne")
      : t("revenue.paidMany", { n: paid.length });
  const unpaidCaption =
    unpaid.length === 1
      ? t("revenue.unpaidOne")
      : t("revenue.unpaidMany", { n: unpaid.length });

  const { insightLine, insightIcon, bestDayLine } = useMemo(() => {
    if (totalThisWeek === 0 && priorWeekPaid === 0) {
      return {
        insightLine: t("revenue.insightEmpty"),
        insightIcon: "flat" as const,
        bestDayLine: null as string | null,
      };
    }
    let line: string;
    let icon: "up" | "down" | "flat" | "new" = "flat";
    if (priorWeekPaid === 0 && totalThisWeek > 0) {
      line = t("revenue.wowNew");
      icon = "new";
    } else if (totalThisWeek === priorWeekPaid) {
      line = t("revenue.wowNone");
      icon = "flat";
    } else {
      const pct = Math.min(
        999,
        Math.abs(
          priorWeekPaid > 0
            ? Math.round(
                ((totalThisWeek - priorWeekPaid) / priorWeekPaid) * 100,
              )
            : 100,
        ),
      );
      if (totalThisWeek > priorWeekPaid) {
        line = t("revenue.wowUp", { pct });
        icon = "up";
      } else {
        line = t("revenue.wowDown", { pct });
        icon = "down";
      }
    }
    const best = series.length
      ? series.reduce(
          (a, b) => (b.value > a.value ? b : a),
          series[0]!,
        )
      : null;
    const bestLine =
      best && best.value > 0
        ? t("revenue.bestDay", {
            day: best.date,
            amount: formatCurrency(best.value),
          })
        : null;
    return {
      insightLine: line,
      insightIcon: icon,
      bestDayLine: bestLine,
    };
  }, [t, totalThisWeek, priorWeekPaid, series]);

  const stats = [
    {
      label: t("revenue.statToday"),
      value: formatCurrency(totalToday),
      caption: t("revenue.capToday"),
      icon: IndianRupee,
      tone: "brand" as const,
    },
    {
      label: t("revenue.statWeek"),
      value: formatCurrency(totalThisWeek),
      caption: t("revenue.capWeek"),
      icon: TrendingUp,
      tone: "info" as const,
    },
    {
      label: t("revenue.statCollected"),
      value: formatCurrency(collected),
      caption: paidCaption,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: t("revenue.statOutstanding"),
      value: formatCurrency(outstanding),
      caption: unpaidCaption,
      icon: Clock,
      tone: "warning" as const,
    },
  ];

  const toneStyles: Record<
    (typeof stats)[number]["tone"],
    { iconBg: string; iconText: string }
  > = {
    brand: { iconBg: "bg-brand/10", iconText: "text-brand" },
    info: {
      iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
      iconText: "text-sky-600 dark:text-sky-300",
    },
    success: {
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      iconText: "text-emerald-600 dark:text-emerald-300",
    },
    warning: {
      iconBg: "bg-amber-500/12 dark:bg-amber-500/15",
      iconText: "text-amber-600 dark:text-amber-300",
    },
  };

  if (!hydrated) {
    return (
      <div className="px-6 py-6 md:px-8">
        <DataListSkeleton showSearch={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow={t("revenue.eyebrow")}
        title={t("revenue.title")}
        description={t("revenue.description")}
      />

      <section
        className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-gradient-to-br from-brand/[0.06] via-card to-sky-500/[0.04] p-4 ring-1 ring-border/50 dark:from-brand/10"
        aria-label="Revenue insight"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              {insightIcon === "up" ? (
                <TrendingUp className="size-4" />
              ) : insightIcon === "down" ? (
                <TrendingDown className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {insightLine}
              </p>
              {totalThisWeek === 0 && priorWeekPaid === 0 ? null : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("revenue.priorWeekLabel")}{" "}
                  <span className="font-medium text-foreground/90">
                    {formatCurrency(priorWeekPaid)}
                  </span>
                  {" · "}
                  {t("revenue.statWeek")}:{" "}
                  <span className="font-medium text-foreground/90">
                    {formatCurrency(totalThisWeek)}
                  </span>
                </p>
              )}
            </div>
          </div>
          {bestDayLine ? (
            <p className="shrink-0 text-xs font-medium text-brand sm:pt-0.5 sm:text-right max-sm:pl-10">
              {bestDayLine}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const styles = toneStyles[s.tone];
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {s.label}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md",
                    styles.iconBg,
                    styles.iconText,
                  )}
                >
                  <Icon className="size-3" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  {s.value}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {s.caption}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <RevenueChart data={series} />
        </div>
        <RevenueMixDonut collected={collected} outstanding={outstanding} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {t("revenue.outstandingTitle")}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {t("revenue.pending", { n: unpaid.length })}
          </span>
        </header>
        {unpaid.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
            {t("revenue.allPaid")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {unpaid.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {inv.number}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {inv.patient}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(inv.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
