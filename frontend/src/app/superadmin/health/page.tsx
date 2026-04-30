"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listHealthScores } from "@/services/superadmin.service";
import type { ClinicHealthItem, RiskLevel } from "@/services/types/superadmin.types";

const RISK_STYLES: Record<RiskLevel, { badge: string; bar: string; icon: React.ElementType }> = {
  low: {
    badge: "bg-green-500/10 text-green-600 dark:text-green-400",
    bar: "bg-green-500",
    icon: ShieldCheck,
  },
  medium: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    icon: ShieldQuestion,
  },
  high: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    icon: ShieldAlert,
  },
};

function ScoreBar({ score, riskLevel }: { score: number; riskLevel: RiskLevel }) {
  const { bar } = RISK_STYLES[riskLevel];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-semibold tabular-nums text-foreground">
        {score}
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function ClinicHealthPage() {
  const [items, setItems] = useState<ClinicHealthItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await listHealthScores({
      page,
      limit: 20,
      search: search.trim() || undefined,
      risk: riskFilter,
    });
    if (res.ok) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setAtRiskCount(res.data.atRiskCount);
      setAvgScore(res.data.avgScore);
    }
    setLoading(false);
  }, [page, search, riskFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinic Health Scores</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Usage activity and churn risk across all clinics
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Avg Health Score"
          value={avgScore}
          sub="out of 100"
          color={avgScore >= 60 ? "text-green-600 dark:text-green-400" : avgScore >= 30 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}
        />
        <SummaryCard
          label="High Risk Clinics"
          value={atRiskCount}
          sub="score < 30"
          color="text-red-600 dark:text-red-400"
        />
        <SummaryCard
          label="Showing"
          value={total}
          sub={riskFilter === "all" ? "all clinics" : `${riskFilter} risk`}
          color="text-foreground"
        />
        <SummaryCard
          label="Score Breakdown"
          value="40/30/30"
          sub="appts / patients / invoices"
          color="text-muted-foreground"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clinics…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-64 rounded-lg bg-card pl-8 text-sm"
          />
        </div>
        <Select
          value={riskFilter}
          onValueChange={(v) => { setRiskFilter(v as typeof riskFilter); setPage(1); }}
        >
          <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="high">High risk</SelectItem>
            <SelectItem value="medium">Medium risk</SelectItem>
            <SelectItem value="low">Low risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,2.5fr)_minmax(0,1.5fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span>
          <span>Health Score</span>
          <span>Risk Level</span>
          <span>Activity (30d)</span>
          <span>Risk Factors</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,2.5fr)_minmax(0,1.5fr)] gap-3 px-4 py-3.5"
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${60 + j * 8}%` }} />
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">No clinics found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((clinic) => {
              const { badge, icon: RiskIcon } = RISK_STYLES[clinic.riskLevel];
              return (
                <li
                  key={clinic.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,2.5fr)_minmax(0,1.5fr)] items-start gap-3 px-4 py-3 text-xs"
                >
                  {/* Clinic */}
                  <div className="overflow-hidden">
                    <p className="truncate font-medium text-foreground">{clinic.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      /{clinic.slug}
                    </p>
                    <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
                      {clinic.billingStatus} · {clinic.plan}
                    </p>
                  </div>

                  {/* Score bar */}
                  <div className="pt-0.5">
                    <ScoreBar score={clinic.score} riskLevel={clinic.riskLevel} />
                  </div>

                  {/* Risk badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge}`}
                    >
                      <RiskIcon className="size-2.5" />
                      {clinic.riskLevel}
                    </span>
                  </div>

                  {/* Activity */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">
                        {clinic.activity.appointmentsLast30}
                      </span>{" "}
                      appts
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">
                        {clinic.activity.patientsLast30}
                      </span>{" "}
                      patients
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">
                        {clinic.activity.invoicesLast30}
                      </span>{" "}
                      invoices
                    </span>
                    <span className="w-full text-[10px]">
                      Last active:{" "}
                      <span className="font-medium text-foreground">
                        {formatRelative(clinic.activity.lastActivityAt)}
                      </span>
                    </span>
                  </div>

                  {/* Risk factors */}
                  <div className="flex flex-col gap-0.5">
                    {clinic.riskFactors.length === 0 ? (
                      <span className="text-[11px] text-green-600 dark:text-green-400">
                        All good
                      </span>
                    ) : (
                      clinic.riskFactors.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] leading-tight text-muted-foreground"
                        >
                          · {f}
                        </span>
                      ))
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="size-8"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="size-8"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
