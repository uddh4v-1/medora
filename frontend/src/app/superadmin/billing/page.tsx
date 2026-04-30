"use client";

import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
  extendTrial,
  listBilling,
  setBillingStatus,
} from "@/services/superadmin.service";
import type { BillingItem, BillingStatus } from "@/services/types/superadmin.types";

const STATUS_STYLES: Record<string, string> = {
  trial: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  unpaid: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  cancelled: "bg-muted text-muted-foreground",
};

const PLAN_STYLES: Record<string, string> = {
  trial: "bg-muted text-muted-foreground",
  starter: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pro: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
}

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isTrialExpired(trialEndsAt: string | null) {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) < new Date();
}

export default function BillingPage() {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BillingStatus>("all");

  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState<Record<string, string>>({});
  const [settingStatus, setSettingStatus] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    const res = await listBilling({
      page,
      limit: 20,
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    });
    if (res.ok) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchBilling();
  }, [fetchBilling]);

  async function handleExtendTrial(clinic: BillingItem) {
    const days = parseInt(extendDays[clinic.id] ?? "14", 10);
    if (!days || days < 1 || days > 365) {
      toast.error("Enter a valid number of days (1–365)");
      return;
    }
    setExtendingId(clinic.id);
    const res = await extendTrial(clinic.id, days);
    if (res.ok) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === clinic.id ? { ...c, trialEndsAt: res.data.trialEndsAt } : c,
        ),
      );
      toast.success(`Trial extended by ${days} day${days !== 1 ? "s" : ""}`);
      setExtendDays((prev) => ({ ...prev, [clinic.id]: "" }));
    } else {
      toast.error("Failed to extend trial");
    }
    setExtendingId(null);
  }

  async function handleSetStatus(clinic: BillingItem, status: BillingStatus) {
    setSettingStatus(`${clinic.id}:${status}`);
    const res = await setBillingStatus(clinic.id, status);
    if (res.ok) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === clinic.id ? { ...c, billingStatus: status } : c,
        ),
      );
      toast.success(`${clinic.name} → ${status}`);
    } else {
      toast.error("Failed to update status");
    }
    setSettingStatus(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <CreditCard className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Subscriptions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total.toLocaleString()} clinic{total !== 1 ? "s" : ""}
          </p>
        </div>
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
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}
        >
          <SelectTrigger className="h-9 w-44 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,2.2fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Trial / Period End</span>
          <span>Actions</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,2.2fr)] gap-3 px-4 py-3.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${50 + j * 10}%` }} />
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">No clinics found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((clinic) => {
              const expired = isTrialExpired(clinic.trialEndsAt);
              return (
                <li
                  key={clinic.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,2.2fr)] items-center gap-3 px-4 py-3 text-xs"
                >
                  <div className="overflow-hidden">
                    <p className="truncate font-medium text-foreground">{clinic.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">/{clinic.slug}</p>
                  </div>

                  <Badge
                    label={clinic.plan}
                    style={PLAN_STYLES[clinic.plan] ?? PLAN_STYLES["trial"]}
                  />

                  <Badge
                    label={clinic.billingStatus}
                    style={STATUS_STYLES[clinic.billingStatus] ?? STATUS_STYLES["trial"]}
                  />

                  <div className="text-muted-foreground">
                    {clinic.billingStatus === "trial" || clinic.billingStatus === "cancelled" ? (
                      <span className={expired ? "text-destructive" : ""}>
                        {formatDateShort(clinic.trialEndsAt)}
                        {expired && clinic.trialEndsAt ? " (expired)" : ""}
                      </span>
                    ) : (
                      <span>{formatDateShort(clinic.currentPeriodEnd)}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Extend trial */}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="days"
                        value={extendDays[clinic.id] ?? ""}
                        onChange={(e) =>
                          setExtendDays((prev) => ({ ...prev, [clinic.id]: e.target.value }))
                        }
                        className="h-7 w-16 px-2 text-[11px]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={extendingId === clinic.id}
                        onClick={() => handleExtendTrial(clinic)}
                        className="h-7 px-2 text-[11px]"
                      >
                        {extendingId === clinic.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "+Trial"
                        )}
                      </Button>
                    </div>

                    {/* Status buttons */}
                    {clinic.billingStatus !== "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={settingStatus === `${clinic.id}:active`}
                        onClick={() => handleSetStatus(clinic, "active")}
                        className="h-7 px-2 text-[11px] border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                      >
                        {settingStatus === `${clinic.id}:active` ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    )}
                    {clinic.billingStatus !== "unpaid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={settingStatus === `${clinic.id}:unpaid`}
                        onClick={() => handleSetStatus(clinic, "unpaid")}
                        className="h-7 px-2 text-[11px] border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      >
                        {settingStatus === `${clinic.id}:unpaid` ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Mark Unpaid"
                        )}
                      </Button>
                    )}
                    {clinic.billingStatus !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={settingStatus === `${clinic.id}:cancelled`}
                        onClick={() => handleSetStatus(clinic, "cancelled")}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                      >
                        {settingStatus === `${clinic.id}:cancelled` ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
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
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="size-8">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="size-8">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
