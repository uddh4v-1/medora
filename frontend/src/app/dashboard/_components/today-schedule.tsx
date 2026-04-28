"use client";

import { ArrowRight, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyGenericIllustration } from "@/components/empty-states/empty-illustrations";
import { WhatsappVisitReminderButton } from "@/components/whatsapp-visit-reminder-button";
import { type Appointment, format12h } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";

export function TodaySchedule({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const { t } = useI18n();
  const visitDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const visible = appointments.slice(0, 4);

  return (
    <section className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-foreground">
            {t("today.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("today.subtitle")}
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
        >
          {t("today.viewAll")}
          <ArrowRight className="size-3" />
        </Link>
      </header>

      {visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <EmptyGenericIllustration className="h-24 w-32" />
          <p className="text-sm text-muted-foreground">
            {t("today.empty")}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((apt) => (
            <li
              key={apt.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <span className="flex w-16 shrink-0 flex-col items-start text-xs">
                <span className="font-semibold text-foreground">
                  {format12h(apt.startTime)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format12h(apt.endTime)}
                </span>
              </span>
              <span aria-hidden className="h-8 w-px bg-border/70" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-foreground">
                  {apt.patient}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Stethoscope className="size-3" />
                  {apt.doctor}
                  <span aria-hidden>·</span>
                  <span className="truncate">{apt.reason}</span>
                </span>
              </div>
              <WhatsappVisitReminderButton
                patientName={apt.patient}
                visitDate={visitDate}
                startTime24={apt.startTime}
                endTime24={apt.endTime}
                doctor={apt.doctor}
                reason={apt.reason}
                size="sm"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
