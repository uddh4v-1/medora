"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSystemHealth } from "@/services/superadmin.service";
import type { SystemHealth } from "@/services/types/superadmin.types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function fmtUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const res = await getSystemHealth();
    if (res.ok) setData(res.data);
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-sm text-muted-foreground">Failed to load system health data.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Platform infrastructure status</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing} className="h-8 gap-1.5 text-xs">
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Uptime" value={fmtUptime(data.uptime)} sub="server process" />
        <StatCard label="Total Clinics" value={data.db.clinicCount} sub="all statuses" />
        <StatCard label="Total Users" value={data.db.userCount} sub="all roles" />
        <StatCard label="Events (24h)" value={data.activity.last24h} sub="audit log entries" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-5 shadow-sm">
          <p className="border-b border-border py-3.5 text-sm font-semibold text-foreground">Platform Snapshot</p>
          <div className="divide-y divide-border/60">
            {[
              { label: "Total Patients", value: data.db.patientCount },
              { label: "Total Appointments", value: data.db.appointmentCount },
              { label: "Total Invoices", value: data.db.invoiceCount },
              { label: "Active Users (24h)", value: data.activity.activeUsers24h },
              { label: "Events (7d)", value: data.activity.last7d },
              { label: "Errors (24h)", value: data.activity.errors24h },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{r.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">Activity Trend (7 days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.activityTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), "Events"]}
                labelFormatter={(l) => new Date(String(l)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
