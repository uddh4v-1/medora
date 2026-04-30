"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Building2, TrendingUp, Users } from "lucide-react";

import { getAnalytics } from "@/services/superadmin.service";
import type { AnalyticsData } from "@/services/types/superadmin.types";

function shortDate(iso: unknown): string {
  if (typeof iso !== "string") return String(iso ?? "");
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={`flex size-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

const STATUS_COLORS = ["#22c55e", "#ef4444"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    getAnalytics().then((res) => {
      if (res.ok) setData(res.data);
    });
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Platform-wide metrics</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const statusPieData = [
    { name: "Active", value: data.clinicStats.active },
    { name: "Suspended", value: data.clinicStats.suspended },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Platform-wide metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Clinics" value={data.clinicStats.total} icon={Building2} color="bg-blue-500" />
        <StatCard label="Active Clinics" value={data.clinicStats.active} icon={Activity} color="bg-green-500" />
        <StatCard label="Suspended Clinics" value={data.clinicStats.suspended} icon={Building2} color="bg-red-500" />
        <StatCard
          label="Appts (14 days)"
          value={data.appointmentsByDay.reduce((s, d) => s + d.count, 0)}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Registrations area chart */}
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Clinic Registrations — Last 30 Days</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.clinicRegistrations} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={shortDate}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={shortDate}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#regGrad)"
                name="Registrations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active vs Suspended donut */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-foreground">Clinic Status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
              >
                {statusPieData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-green-500" />
              Active ({data.clinicStats.active})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              Suspended ({data.clinicStats.suspended})
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">Appointments Booked — Last 14 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.appointmentsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={shortDate}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={shortDate}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top clinics table */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <p className="text-sm font-semibold text-foreground">Top Clinics by Patient Volume</p>
          </div>
          {data.topClinicsByPatients.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No patient data yet.</p>
          ) : (
            <ol className="divide-y divide-border/60">
              {data.topClinicsByPatients.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">/{c.slug}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground">
                    {c.patientCount.toLocaleString()} <span className="font-normal text-muted-foreground">pts</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
