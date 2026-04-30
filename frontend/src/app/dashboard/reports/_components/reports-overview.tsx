"use client";

import { BarChart2, Loader2, Pill, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import {
  DateRangePicker,
  rangeFromPreset,
  type DateRange,
} from "@/components/dashboard/date-range-picker";
import { useI18n } from "@/lib/i18n/provider";
import { useHydrated } from "@/stores/clinic-store";
import {
  getReportsOverview,
  type ReportsOverviewResponse,
} from "@/services/dashboard.service";

import { DashboardPageHeader } from "../../_components/page-header";
import { ReportsDemographicsCharts } from "./reports-demographics-charts";
import { ReportsRankedBars } from "./reports-ranked-bars";

function fmtDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function ReportsOverview() {
  const { t } = useI18n();
  const hydrated = useHydrated();

  const [presetKey, setPresetKey] = useState("30d");
  const [range, setRange] = useState<DateRange>(() => rangeFromPreset("30d"));
  const [data, setData] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    getReportsOverview(range.from, range.to).then((res) => {
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

  const medItems = (data?.topMedications ?? []).map((m) => ({
    id: m.name,
    label: m.name,
    value: m.count,
    valueSuffix: "×",
  }));

  const docItems = (data?.doctorUtilization ?? []).map((doc) => ({
    id: doc.name,
    label: doc.name,
    value: doc.appointmentCount,
    right:
      doc.appointmentCount === 1
        ? t("reports.docSlot", { n: doc.appointmentCount })
        : t("reports.docSlots", { n: doc.appointmentCount }),
  }));

  const trendData = (data?.appointmentsTrend ?? []).map((p) => ({
    date: fmtDateLabel(p.date),
    count: p.count,
  }));

  const noShow = data?.noShow ?? { count: 0, total: 0, ratePercent: null };
  const rateStr = noShow.ratePercent != null ? `${noShow.ratePercent}%` : t("reports.noRate");

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardPageHeader
          eyebrow={t("reports.eyebrow")}
          title={t("reports.title")}
          description={t("reports.description")}
        />
        <DateRangePicker value={presetKey} onChange={handleRangeChange} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Pill className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              {t("reports.statTopMed")}
            </span>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {data?.topMedications[0]?.name ?? t("reports.noRate")}
          </p>
          <p className="text-xs text-muted-foreground">{t("reports.capTopMed")}</p>
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <BarChart2 className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              {t("reports.statNoshow")}
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{rateStr}</p>
          <p className="text-xs text-muted-foreground">
            {t("reports.capNoshow", { count: noShow.count, total: noShow.total })}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              Appointments
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{noShow.total}</p>
          <p className="text-xs text-muted-foreground">In selected period</p>
        </div>
      </div>

      {/* Appointments trend chart */}
      {trendData.length > 1 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
          <h3 className="text-sm font-semibold text-foreground">Appointments trend</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Daily appointment count in selected period</p>
          <div className="mt-4 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} className="stroke-border/80" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(160 8% 50% / 0.08)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]!.payload as { date: string; count: number };
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-left shadow-md">
                        <p className="text-[11px] text-muted-foreground">{row.date}</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                          {row.count} appointment{row.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" fill="#2d5843" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
          <h3 className="text-sm font-semibold text-foreground">{t("reports.medTitle")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("reports.medSub")}</p>
          {medItems.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("reports.medEmpty")}</p>
          ) : (
            <div className="mt-4">
              <ReportsRankedBars items={medItems} accent="brand" />
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
          <h3 className="text-sm font-semibold text-foreground">{t("reports.docTitle")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("reports.docSub")}</p>
          {docItems.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("reports.docEmpty")}</p>
          ) : (
            <div className="mt-4">
              <ReportsRankedBars items={docItems} accent="sky" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
        <h3 className="text-sm font-semibold text-foreground">{t("reports.demoTitle")}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("reports.demoSub", { n: 0 })}
        </p>
        <div className="mt-4">
          <ReportsDemographicsCharts d={{ total: 0, gender: { male: 0, female: 0, unknown: 0 }, ageBuckets: { "0–17": 0, "18–35": 0, "36–50": 0, "51+": 0 } }} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">{t("reports.footer")}</p>
    </div>
  );
}
