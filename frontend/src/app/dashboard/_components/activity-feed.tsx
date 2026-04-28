"use client";

import {
  CalendarPlus,
  FileText,
  IndianRupee,
  ListOrdered,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { buildActivityEvents } from "@/lib/activity-feed";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const kindIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  rx: Pill,
  invoice: IndianRupee,
  visit: ListOrdered,
  appointment: CalendarPlus,
};

function formatAgo(
  iso: string,
  bcp47: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  const ts = new Date(iso).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t("activity.justNow");
  if (mins < 60) return t("activity.minsAgo", { n: mins });
  const h = Math.floor(mins / 60);
  if (h < 24) return t("activity.hoursAgo", { n: h });
  return new Date(ts).toLocaleDateString(bcp47, {
    day: "numeric",
    month: "short",
  });
}

export function ActivityFeed() {
  const { t, bcp47 } = useI18n();
  const prescriptions = useClinicStore((s) => s.prescriptions);
  const invoices = useClinicStore((s) => s.invoices);
  const visits = useClinicStore((s) => s.visits);
  const appointments = useClinicStore((s) => s.appointments);

  const events = useMemo(
    () =>
      buildActivityEvents({
        prescriptions,
        invoices,
        visits,
        appointments,
      }),
    [prescriptions, invoices, visits, appointments],
  );

  return (
    <section className="flex h-full min-h-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">
          {t("activity.title")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("activity.subtitle")}
        </p>
      </header>

      {events.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          {t("activity.empty")}
        </p>
      ) : (
        <ul
          className="flex min-h-0 flex-1 flex-col gap-0"
          role="list"
        >
          {events.map((e, i) => {
            const Icon = kindIcon[e.kind] ?? FileText;
            return (
              <li key={e.id}>
                <Link
                  href={e.href}
                  className={cn(
                    "flex items-start gap-2.5 py-2.5 transition-colors hover:text-foreground",
                    "border-border/50 border-b last:border-b-0",
                    i === 0 ? "pt-0" : "",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      e.kind === "rx" && "bg-brand/10 text-brand",
                      e.kind === "invoice" && "bg-amber-500/10 text-amber-600",
                      e.kind === "visit" && "bg-sky-500/10 text-sky-600",
                      e.kind === "appointment" &&
                        "bg-violet-500/10 text-violet-600",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.title}
                    </p>
                    {e.subtitle ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {e.subtitle}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {formatAgo(e.at, bcp47, t)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
