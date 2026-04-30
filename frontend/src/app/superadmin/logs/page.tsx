"use client";

import { ChevronLeft, ChevronRight, Download, Filter, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAuditLogs,
  type AuditLogItem,
  type AuditLogsQuery,
} from "@/services/audit.service";
import { toast } from "sonner";
import { downloadExport } from "@/services/superadmin.service";

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "API_CALL", label: "API Call" },
  { value: "PAGE_VIEW", label: "Page View" },
  { value: "BUTTON_CLICK", label: "Button Click" },
  { value: "FORM_SUBMIT", label: "Form Submit" },
  { value: "CUSTOM", label: "Custom" },
];

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    API_CALL: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PAGE_VIEW: "bg-green-500/10 text-green-600 dark:text-green-400",
    BUTTON_CLICK: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    FORM_SUBMIT: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    CUSTOM: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[action] ?? "bg-muted text-muted-foreground"}`}
    >
      {action.replace("_", " ")}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [clinicSearch, setClinicSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const query: AuditLogsQuery = { page, limit: 50 };
    if (actionFilter !== "all") query.action = actionFilter;
    if (clinicSearch.trim()) query.clinicId = clinicSearch.trim();

    const res = await getAuditLogs(query);
    if (res.ok) {
      let items = res.data.items;
      if (userSearch.trim()) {
        const q = userSearch.trim().toLowerCase();
        items = items.filter(
          (l) =>
            l.userEmail?.toLowerCase().includes(q) ||
            l.userName?.toLowerCase().includes(q) ||
            l.userId?.toLowerCase().includes(q),
        );
      }
      setLogs(items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [page, actionFilter, userSearch, clinicSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} total events across all clinics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadExport("audit-logs").catch((e: Error) => toast.error(e.message))} className="h-8 gap-1.5 text-xs">
          <Download className="size-3.5" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 shrink-0 text-muted-foreground" />

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by user email / name..."
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setPage(1); }}
            className="h-9 w-56 rounded-lg bg-card pl-8 text-sm"
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by clinic ID..."
            value={clinicSearch}
            onChange={(e) => { setClinicSearch(e.target.value); setPage(1); }}
            className="h-9 w-48 rounded-lg bg-card pl-8 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Timestamp</span>
          <span>Action</span>
          <span>Resource</span>
          <span>User</span>
          <span>IP</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-4 py-3"
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-3 animate-pulse rounded bg-muted"
                    style={{ width: `${60 + j * 10}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No audit logs found for the current filters.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {logs.map((log) => (
              <li
                key={log.id}
                className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/20"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {formatDate(log.createdAt)}
                </span>
                <ActionBadge action={log.action} />
                <span className="truncate font-mono text-[11px] text-foreground">
                  {log.resource}
                </span>
                <span className="truncate text-muted-foreground">
                  {log.userEmail ?? log.userId ?? "—"}
                </span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {log.ip ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
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
