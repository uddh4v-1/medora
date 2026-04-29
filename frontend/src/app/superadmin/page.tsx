"use client";

import { Activity, Building2, CalendarCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getSuperAdminStats, type SuperAdminStats } from "@/services/audit.service";

export default function SuperAdminPage() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);

  useEffect(() => {
    getSuperAdminStats().then((res) => {
      if (res.ok) setStats(res.data);
    });
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Clinics",
          value: stats.totalClinics,
          icon: Building2,
          desc: "Registered clinics on platform",
        },
        {
          label: "Total Users",
          value: stats.totalUsers,
          icon: Users,
          desc: "All clinic staff (excl. superadmin)",
        },
        {
          label: "Audit Events",
          value: stats.totalEvents,
          icon: CalendarCheck,
          desc: "All time logged events",
        },
        {
          label: "Events (24h)",
          value: stats.recentEvents,
          icon: Activity,
          desc: "Activity in last 24 hours",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-clinic visibility. All data across all tenants.
        </p>
      </div>

      {stats === null ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <c.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{c.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/superadmin/logs"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Activity className="size-4" />
            View Audit Logs
          </a>
        </div>
      </div>
    </div>
  );
}
