"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Zap,
} from "lucide-react";

import { getFinancialDashboard } from "@/services/superadmin.service";
import type { FinancialDashboard } from "@/services/types/superadmin.types";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function shortMonth(ym: string) {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

const PLAN_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  pro: "#8b5cf6",
  trial: "#94a3b8",
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
        {sub && (
          <p
            className={`mt-0.5 text-[11px] font-medium ${
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-24 animate-pulse rounded-xl border border-border bg-muted" />;
}

export default function FinancialDashboardPage() {
  const [data, setData] = useState<FinancialDashboard | null>(null);

  useEffect(() => {
    getFinancialDashboard().then((res) => {
      if (res.ok) setData(res.data);
    });
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Revenue, MRR & forecasting</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
      fontSize: "12px",
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Revenue, MRR & forecasting</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Recurring Revenue"
          value={fmt(data.mrr)}
          sub={`ARR ${fmt(data.arr)}`}
          icon={DollarSign}
          color="bg-green-500"
          trend="neutral"
        />
        <StatCard
          label="Active Subscriptions"
          value={data.summary.activeCount.toLocaleString()}
          sub={`${data.summary.trialCount} on trial`}
          icon={BarChart2}
          color="bg-blue-500"
          trend="neutral"
        />
        <StatCard
          label="Churn Rate (30d)"
          value={`${data.churnRate}%`}
          sub={`${data.summary.cancelledCount} cancelled total`}
          icon={TrendingDown}
          color={data.churnRate > 10 ? "bg-red-500" : "bg-amber-500"}
          trend={data.churnRate > 10 ? "down" : "neutral"}
        />
        <StatCard
          label="Trials Expiring (30d)"
          value={data.forecast.trialsExpiringSoon.toLocaleString()}
          sub={`${data.forecast.conversionRate}% conv. rate`}
          icon={AlertTriangle}
          color="bg-orange-500"
          trend="neutral"
        />
      </div>

      {/* MRR Trend */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">New vs. Churned MRR — Last 12 Months</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.mrrTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tickFormatter={shortMonth}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, name) => [
                fmt(Number(v ?? 0)),
                name === "newMrr" ? "New MRR" : name === "churnedMrr" ? "Churned MRR" : "Net MRR",
              ]}
              labelFormatter={(label) => shortMonth(String(label ?? ""))}
            />
            <Legend
              formatter={(v) =>
                v === "newMrr" ? "New MRR" : v === "churnedMrr" ? "Churned MRR" : "Net MRR"
              }
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="newMrr"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#newGrad)"
              name="newMrr"
            />
            <Area
              type="monotone"
              dataKey="churnedMrr"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#churnGrad)"
              name="churnedMrr"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Plan + Forecast */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by plan */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-foreground">Revenue by Plan</p>
          {data.revenueByPlan.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No active paid subscriptions yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.revenueByPlan}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="plan"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [fmt(Number(v ?? 0)), "MRR"]}
                />
                <Bar dataKey="mrr" radius={[4, 4, 0, 0]} name="MRR">
                  {data.revenueByPlan.map((entry) => (
                    <Cell
                      key={entry.plan}
                      fill={PLAN_COLORS[entry.plan] ?? "#94a3b8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Plan breakdown table */}
          {data.revenueByPlan.length > 0 && (
            <div className="mt-4 divide-y divide-border/60 rounded-lg border border-border">
              {data.revenueByPlan.map((p) => (
                <div key={p.plan} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: PLAN_COLORS[p.plan] ?? "#94a3b8" }}
                    />
                    <span className="capitalize font-medium text-foreground">{p.plan}</span>
                    <span className="text-muted-foreground">{p.count} clinic{p.count !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="font-semibold text-foreground">{fmt(p.mrr)}/mo</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">Revenue Forecast</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Based on trial-to-paid conversion rate over trials expiring in the next 30 days.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-xs text-muted-foreground">Trials expiring (30d)</span>
                <span className="text-sm font-bold text-foreground">
                  {data.forecast.trialsExpiringSoon}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-xs text-muted-foreground">Historical conversion rate</span>
                <span className="text-sm font-bold text-foreground">
                  {data.forecast.conversionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-4 py-3">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Projected new MRR
                </span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  {fmt(data.forecast.projectedNewMrr)}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription status summary */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Subscription Breakdown</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active", value: data.summary.activeCount, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
                { label: "Trial", value: data.summary.trialCount, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
                { label: "Unpaid", value: data.summary.unpaidCount, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                { label: "Cancelled", value: data.summary.cancelledCount, color: "text-muted-foreground", bg: "bg-muted" },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col items-center rounded-lg px-3 py-3 ${s.bg}`}>
                  <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
