"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Code2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiUsage } from "@/services/superadmin.service";
import type { ApiUsageItem } from "@/services/types/superadmin.types";

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value.toLocaleString()}</span>
    </div>
  );
}

export default function ApiUsagePage() {
  const [items, setItems] = useState<ApiUsageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const maxRequests = items.length > 0 ? Math.max(...items.map(i => i.requestsLast30d)) : 1;

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    const res = await getApiUsage({ page, limit: 20, search: search.trim() || undefined });
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); setTotalPages(res.data.totalPages); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { void fetchUsage(); }, [fetchUsage]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Code2 className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Usage per Clinic</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} clinic{total !== 1 ? "s" : ""} with activity</p>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clinics…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-9 rounded-lg bg-card pl-8 text-sm" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2.5fr)_minmax(0,1fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span><span>Requests (30d)</span><span>Status</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 px-4 py-3.5">
                {[0,1,2].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No API usage data found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item, idx) => (
              <li key={item.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,2.5fr)_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 text-[10px] font-bold text-muted-foreground">{(page-1)*20+idx+1}.</span>
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                  </div>
                  <p className="truncate font-mono text-[11px] text-muted-foreground ml-5">/{item.slug}</p>
                </div>
                <Bar value={item.requestsLast30d} max={maxRequests} />
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${item.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span>Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="size-7"><ChevronLeft className="size-3" /></Button>
              <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="size-7"><ChevronRight className="size-3" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
