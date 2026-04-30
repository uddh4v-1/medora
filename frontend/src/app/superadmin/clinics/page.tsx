"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  LogIn,
  Search,
  Trash2,
  Users,
  CheckSquare,
  Square,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  deleteClinic,
  downloadExport,
  impersonateClinic,
  listClinics,
  setClinicStatus,
  bulkClinicAction,
} from "@/services/superadmin.service";
import type { ClinicListItem } from "@/services/types/superadmin.types";

function StatusBadge({ status }: { status: "active" | "suspended" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        status === "active"
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClinicsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ClinicListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const [entering, setEntering] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    const res = await listClinics({
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
    setSelected(new Set());
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchClinics();
  }, [fetchClinics]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((c) => c.id)));
    }
  }

  async function handleBulkAction(action: "activate" | "suspend" | "delete") {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setBulkLoading(true);
    const res = await bulkClinicAction(ids, action);
    if (res.ok) {
      toast.success(`${res.data.affected} clinic${res.data.affected !== 1 ? "s" : ""} ${action}d`);
      await fetchClinics();
    } else {
      toast.error("Bulk action failed");
    }
    setBulkLoading(false);
    setSelected(new Set());
  }

  async function handleToggleStatus(clinic: ClinicListItem) {
    setToggling(clinic.id);
    const next = clinic.status === "active" ? "suspended" : "active";
    const res = await setClinicStatus(clinic.id, next);
    if (res.ok) {
      setItems((prev) => prev.map((c) => (c.id === clinic.id ? { ...c, status: next } : c)));
      toast.success(next === "suspended" ? `${clinic.name} suspended` : `${clinic.name} reactivated`);
    } else {
      toast.error("Failed to update status");
    }
    setToggling(null);
  }

  async function handleDelete(clinic: ClinicListItem) {
    if (deleteConfirm !== clinic.id) {
      setDeleteConfirm(clinic.id);
      return;
    }
    setDeleting(clinic.id);
    setDeleteConfirm(null);
    const res = await deleteClinic(clinic.id);
    if (res.ok) {
      setItems((prev) => prev.filter((c) => c.id !== clinic.id));
      setTotal((t) => t - 1);
      toast.success(`${clinic.name} deleted`);
    } else {
      toast.error("Failed to delete clinic");
    }
    setDeleting(null);
  }

  async function handleEnter(clinic: ClinicListItem) {
    setEntering(clinic.id);
    const res = await impersonateClinic(clinic.id);
    if (res.ok) {
      toast.success(`Entering ${res.data.clinicName} as ${res.data.ownerName}`);
      router.push("/dashboard");
    } else {
      toast.error("Could not enter clinic");
      setEntering(null);
    }
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinics</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total.toLocaleString()} registered clinic{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadExport("clinics").catch((e: Error) => toast.error(e.message))} className="h-8 gap-1.5 text-xs">
          <Download className="size-3.5" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, slug or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-64 rounded-lg bg-card pl-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}
        >
          <SelectTrigger className="h-9 w-40 rounded-lg border-border bg-card text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("activate")}
              className="h-8 px-3 text-xs border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
            >
              {bulkLoading ? <Loader2 className="size-3 animate-spin" /> : "Activate All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("suspend")}
              className="h-8 px-3 text-xs border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
            >
              {bulkLoading ? <Loader2 className="size-3 animate-spin" /> : "Suspend All"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkLoading}
              onClick={() => handleBulkAction("delete")}
              className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10"
            >
              {bulkLoading ? <Loader2 className="size-3 animate-spin" /> : "Delete All"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
              className="h-8 px-3 text-xs text-muted-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[28px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <button
            onClick={toggleSelectAll}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            {allSelected ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
          </button>
          <span>Clinic</span>
          <span>Phone</span>
          <span>Status</span>
          <span className="flex items-center gap-1"><Users className="size-3" /> Users</span>
          <span className="flex items-center gap-1"><Building2 className="size-3" /> Patients</span>
          <span>Joined</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[28px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] gap-3 px-4 py-3.5">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${55 + j * 6}%` }} />
                ))}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted-foreground">No clinics found.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((clinic) => (
              <li
                key={clinic.id}
                className={`grid grid-cols-[28px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.4fr)] items-center gap-3 px-4 py-3 text-xs transition-colors ${selected.has(clinic.id) ? "bg-primary/5" : "hover:bg-muted/20"}`}
              >
                <button onClick={() => toggleSelect(clinic.id)} className="flex items-center text-muted-foreground hover:text-foreground">
                  {selected.has(clinic.id) ? <CheckSquare className="size-3.5 text-primary" /> : <Square className="size-3.5" />}
                </button>

                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="truncate font-medium text-foreground">{clinic.name}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">/{clinic.slug}</span>
                </div>

                <span className="truncate text-muted-foreground">{clinic.phone}</span>
                <StatusBadge status={clinic.status} />
                <span className="text-muted-foreground">{clinic.userCount}</span>
                <span className="text-muted-foreground">{clinic.patientCount}</span>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{formatDate(clinic.createdAt)}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm" disabled={entering === clinic.id || clinic.status === "suspended"}
                      onClick={() => handleEnter(clinic)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600"
                      title={clinic.status === "suspended" ? "Cannot enter suspended clinic" : "Enter as Owner"}
                    >
                      {entering === clinic.id ? <Loader2 className="size-3 animate-spin" /> : <LogIn className="size-3" />}
                    </Button>
                    <Button
                      variant="outline" size="sm" disabled={toggling === clinic.id}
                      onClick={() => handleToggleStatus(clinic)}
                      className={`h-7 px-2 text-[11px] font-medium ${clinic.status === "active" ? "border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"}`}
                    >
                      {toggling === clinic.id ? <Loader2 className="size-3 animate-spin" /> : clinic.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost" size="sm" disabled={deleting === clinic.id}
                      onClick={() => handleDelete(clinic)}
                      className={`h-7 w-7 p-0 ${deleteConfirm === clinic.id ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "text-muted-foreground hover:text-destructive"}`}
                      title={deleteConfirm === clinic.id ? "Click again to confirm" : "Delete clinic"}
                    >
                      {deleting === clinic.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
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

      {deleteConfirm && <div className="fixed inset-0 z-10" onClick={() => setDeleteConfirm(null)} />}
    </div>
  );
}
