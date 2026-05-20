"use client";

import {
  ArrowRight,
  CalendarDays,
  IndianRupee,
  ListOrdered,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  type DashboardStat,
} from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { useDashboardSession } from "../_hooks/use-dashboard-session";


import { ActivityFeed } from "./activity-feed";
import { AiInsight } from "./ai-insight";
import { NowServingMini } from "./now-serving-mini";
import { DashboardPageHeader } from "./page-header";
import { QuickActions } from "./quick-actions";
import { StatCard } from "./stat-card";
import { DashboardOverviewSkeleton } from "./dashboard-overview-skeleton";
import { TodaySchedule } from "./today-schedule";

function formatTodayEyebrow(locale: string) {
  const today = new Date();
  const weekday = today
    .toLocaleDateString(locale, { weekday: "long" })
    .toUpperCase();
  const day = today.getDate();
  const month = today
    .toLocaleDateString(locale, { month: "long" })
    .toUpperCase();
  return `${weekday}, ${day} ${month}`;
}

export function DashboardOverview() {
  const { t, bcp47 } = useI18n();
  const hydrated = useHydrated();
  const { shortName, clinicName } = useDashboardSession();
  const appointments = useClinicStore((s) => s.appointments);
  const visits = useClinicStore((s) => s.visits);
  const overviewStats = useClinicStore((s) => s.overviewStats);

  const eyebrow = formatTodayEyebrow(bcp47);
  const inProgress = visits.find((v) => v.status === "in-progress") ?? null;
  const waiting = overviewStats?.waitingCount ?? visits.filter((v) => v.status === "waiting").length;
  const unpaid = overviewStats?.unpaidCount ?? 0;

  const stats: DashboardStat[] = [
    {
      id: "appts",
      label: t("dashboard.stat.appointments"),
      value: (overviewStats?.appointmentsToday ?? appointments.length).toString(),
      caption: t("dashboard.stat.appointmentsCap"),
      icon: CalendarDays,
      tone: "info",
    },
    {
      id: "waiting",
      label: t("dashboard.stat.waiting"),
      value: waiting.toString(),
      caption: t("dashboard.stat.inQueue"),
      icon: ListOrdered,
      tone: "coral",
    },
    {
      id: "patients",
      label: t("dashboard.stat.patients"),
      value: (overviewStats?.patientsTotal ?? 0).toString(),
      caption: t("dashboard.stat.lifetime"),
      icon: Users,
      tone: "brand",
    },
    {
      id: "unpaid",
      label: t("dashboard.stat.unpaid"),
      value: unpaid.toString(),
      caption:
        unpaid === 0
          ? t("dashboard.stat.allSettled")
          : t("dashboard.stat.awaiting"),
      icon: IndianRupee,
      tone: "warning",
    },
  ];

  if (!hydrated) {
    return <DashboardOverviewSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow={eyebrow}
        title={t("dashboard.hello", { name: shortName })}
        description={t("dashboard.subtitle", { clinic: clinicName })}
        actions={
          <>
            <Button
              asChild
              className="h-9 gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
            >
              <Link href="/dashboard/queue">
                {t("dashboard.openQueue")}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Link href="/dashboard/patients">{t("dashboard.patientsBtn")}</Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodaySchedule appointments={appointments} />
        </div>
        <NowServingMini visit={inProgress} waiting={waiting} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
          <QuickActions />
          <ActivityFeed />
        </div>
        <AiInsight />
      </section>
    </div>
  );
}
