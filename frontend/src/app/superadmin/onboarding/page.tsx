"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOnboarding } from "@/services/superadmin.service";
import type { OnboardingItem } from "@/services/types/superadmin.types";

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "bg-green-500" : percent >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground">{percent}%</span>
    </div>
  );
}

export default function OnboardingPage() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [needsNudge, setNeedsNudge] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await getOnboarding({ page, limit: 20, search: search.trim() || undefined });
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); setTotalPages(res.data.totalPages); setNeedsNudge(res.data.needsNudge); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { void fetch(); }, [fetch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <ListChecks className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboarding Tracker</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{needsNudge} clinic{needsNudge !== 1 ? "s" : ""} below 60% completion</p>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clinics…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 rounded-lg bg-card pl-8 text-sm" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,3fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span><span>Progress</span><span>Steps</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border/60">{Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,3fr)] gap-3 px-4 py-3.5">
              {[0,1,2].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}
            </div>
          ))}</div>
        ) : items.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No clinics found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((clinic) => (
              <li key={clinic.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,3fr)] items-start gap-3 px-4 py-3 text-xs">
                <div>
                  <p className="truncate font-medium text-foreground">{clinic.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/{clinic.slug}</p>
                  <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">{clinic.billingStatus} · {clinic.plan}</p>
                </div>
                <div className="pt-1"><ProgressBar percent={clinic.percent} /></div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                  {clinic.steps.map((s) => (
                    <span key={s.key} className={`text-[11px] ${s.done ? "text-green-600 dark:text-green-400" : "text-muted-foreground line-through"}`}>
                      {s.done ? "✓" : "○"} {s.label}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="size-8"><ChevronLeft className="size-4" /></Button>
            <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="size-8"><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
