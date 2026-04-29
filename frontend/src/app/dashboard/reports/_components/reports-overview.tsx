"use client";

import { BarChart2, Pill, Sparkles, Users } from "lucide-react";
import { useMemo } from "react";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { buildReports } from "@/lib/reports";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";

import { DashboardPageHeader } from "../../_components/page-header";

import { ReportsDemographicsCharts } from "./reports-demographics-charts";
import { ReportsRankedBars } from "./reports-ranked-bars";

export function ReportsOverview() {
  const { t } = useI18n();
  const hydrated = useHydrated();
  const prescriptions = useClinicStore((s) => s.prescriptions);
  const appointments = useClinicStore((s) => s.appointments);
  const patients = useClinicStore((s) => s.patients);

  const r = useMemo(
    () =>
      buildReports({
        prescriptions,
        appointments,
        patients,
      }),
    [prescriptions, appointments, patients],
  );

  const medItems = useMemo(
    () =>
      r.topMedications.map((m) => ({
        id: m.name,
        label: m.name,
        value: m.count,
        valueSuffix: "×",
      })),
    [r.topMedications],
  );

  const docItems = useMemo(
    () =>
      r.doctorUtilization.map((doc) => ({
        id: doc.name,
        label: doc.name,
        value: doc.appointmentCount,
        right:
          doc.appointmentCount === 1
            ? t("reports.docSlot", { n: doc.appointmentCount })
            : t("reports.docSlots", { n: doc.appointmentCount }),
      })),
    [r.doctorUtilization, t],
  );

  const rateStr = useMemo(() => {
    if (r.noShow.ratePercent == null) return t("reports.noRate");
    return `${r.noShow.ratePercent}%`;
  }, [r.noShow.ratePercent, t]);

  const medLead = r.topMedications[0]?.name ?? t("reports.noRate");

  const insight = t("reports.insight", {
    rate: rateStr,
    med: medLead,
    n: r.demographics.total,
  });

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
        eyebrow={t("reports.eyebrow")}
        title={t("reports.title")}
        description={t("reports.description")}
      />

      <section
        className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-gradient-to-br from-brand/[0.06] via-card to-sky-500/[0.04] p-4 ring-1 ring-border/50 dark:from-brand/10"
        aria-label="Reports insight"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
          <Sparkles className="size-4" />
        </span>
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {insight}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Pill className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              {t("reports.statTopMed")}
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {r.topMedications[0]?.name ?? t("reports.noRate")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("reports.capTopMed")}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <BarChart2 className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              {t("reports.statNoshow")}
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {r.noShow.ratePercent != null
              ? `${r.noShow.ratePercent}%`
              : t("reports.noRate")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("reports.capNoshow", {
              count: r.noShow.count,
              total: r.noShow.total,
            })}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-card-soft dark:shadow-none sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
              {t("reports.statPatients")}
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {r.demographics.total}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("reports.capPatients")}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
          <h3 className="text-sm font-semibold text-foreground">
            {t("reports.medTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("reports.medSub")}
          </p>
          {r.topMedications.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("reports.medEmpty")}
            </p>
          ) : (
            <div className="mt-4">
              <ReportsRankedBars items={medItems} accent="brand" />
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
          <h3 className="text-sm font-semibold text-foreground">
            {t("reports.docTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("reports.docSub")}
          </p>
          {r.doctorUtilization.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("reports.docEmpty")}
            </p>
          ) : (
            <div className="mt-4">
              <ReportsRankedBars items={docItems} accent="sky" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
        <h3 className="text-sm font-semibold text-foreground">
          {t("reports.demoTitle")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("reports.demoSub", { n: r.demographics.total })}
        </p>
        <div className="mt-4">
          <ReportsDemographicsCharts d={r.demographics} />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("reports.footer")}
      </p>
    </div>
  );
}
