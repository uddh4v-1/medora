"use client";

import {
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import {
  DateRangePicker,
  rangeFromPreset,
  type DateRange,
} from "@/components/dashboard/date-range-picker";
import { formatCurrency } from "@/lib/dashboard-content";
import type { RevenuePoint } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { useHydrated } from "@/stores/clinic-store";
import {
  getRevenueSummary,
  type RevenueSummaryResponse,
} from "@/services/dashboard.service";
import { cn } from "@/lib/utils";

import { DashboardPageHeader } from "../../_components/page-header";
import { RevenueChart } from "../../_components/revenue-chart";
import { RevenueMixDonut } from "../../_components/revenue-mix-donut";

function fmtDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function RevenueOverview() {
  const { t } = useI18n();
  const hydrated = useHydrated();

  const [presetKey, setPresetKey] = useState("30d");
  const [range, setRange] = useState<DateRange>(() => rangeFromPreset("30d"));
  const [data, setData] = useState<RevenueSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    getRevenueSummary(range.from, range.to).then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }, [hydrated, range]);

  function handleRangeChange(r: DateRange, key: string) {
    setRange(r);
    setPresetKey(key);
  }

  if (!hydrated) {
    return (
      <div className="px-6 py-6 md:px-8">
        <DataListSkeleton showSearch={false} />
      </div>
    );
  }

  const series: RevenuePoint[] = (data?.series ?? []).map((s) => ({
    date: fmtDateLabel(s.date),
    value: s.amount,
    iso: s.date,
  }));

  const collected = data?.totals.collected ?? 0;
  const outstanding = data?.totals.outstanding ?? 0;
  const thisPeriod = data?.totals.thisPeriod ?? 0;
  const todayRevenue = data?.totals.today ?? 0;
  const outstandingInvoices = data?.outstandingInvoices ?? [];

  const bestDay = series.length
    ? series.reduce((a, b) => (b.value > a.value ? b : a), series[0]!)
    : null;

  const stats = [
    {
      label: "Today",
      value: formatCurrency(todayRevenue),
      caption: "Paid invoices today",
      icon: IndianRupee,
      tone: "brand" as const,
    },
    {
      label: "This period",
      value: formatCurrency(thisPeriod),
      caption: `${range.from} → ${range.to}`,
      icon: TrendingUp,
      tone: "info" as const,
    },
    {
      label: "Collected",
      value: formatCurrency(collected),
      caption: `${data ? data.outstandingInvoices.length + (data.series.length > 0 ? "+" : "0") : "—"} paid invoices`,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstanding),
      caption: `${outstandingInvoices.length} unpaid invoice${outstandingInvoices.length !== 1 ? "s" : ""}`,
      icon: Clock,
      tone: "warning" as const,
    },
  ];

  const toneStyles: Record<
    (typeof stats)[number]["tone"],
    { iconBg: string; iconText: string }
  > = {
    brand: { iconBg: "bg-brand/10", iconText: "text-brand" },
    info: { iconBg: "bg-sky-500/10 dark:bg-sky-500/15", iconText: "text-sky-600 dark:text-sky-300" },
    success: { iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-300" },
    warning: { iconBg: "bg-amber-500/12 dark:bg-amber-500/15", iconText: "text-amber-600 dark:text-amber-300" },
  };

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardPageHeader
          eyebrow={t("revenue.eyebrow")}
          title={t("revenue.title")}
          description={t("revenue.description")}
        />
        <DateRangePicker value={presetKey} onChange={handleRangeChange} />
      </div>

      {bestDay && bestDay.value > 0 && (
        <section className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-gradient-to-br from-brand/[0.06] via-card to-sky-500/[0.04] p-4 ring-1 ring-border/50 dark:from-brand/10">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <TrendingUp className="size-4" />
          </span>
          <p className="text-sm font-medium text-foreground">
            Best day in period:{" "}
            <span className="text-brand">{bestDay.date}</span>
            {" · "}
            {formatCurrency(bestDay.value)}
          </p>
        </section>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      )}

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
                <span className={cn("flex size-6 items-center justify-center rounded-md", styles.iconBg, styles.iconText)}>
                  <Icon className="size-3" />
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold tracking-tight text-foreground">{s.value}</span>
                <span className="text-[11px] text-muted-foreground">{s.caption}</span>
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
            {t("revenue.pending", { n: outstandingInvoices.length })}
          </span>
        </header>
        {outstandingInvoices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
            {t("revenue.allPaid")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {outstandingInvoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{inv.number}</span>
                  <span className="text-[11px] text-muted-foreground">{inv.patientName}</span>
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
