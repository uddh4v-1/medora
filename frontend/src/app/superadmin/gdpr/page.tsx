"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listDeletionRequests, createDeletionRequest, setDeletionRequestStatus, downloadClinicData } from "@/services/superadmin.service";
import type { DeletionRequestItem } from "@/services/types/superadmin.types";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
};

export default function GdprPage() {
  const [items, setItems] = useState<DeletionRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newClinicId, setNewClinicId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await listDeletionRequests({ page, limit: 20, status: statusFilter === "all" ? undefined : statusFilter });
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); setTotalPages(res.data.totalPages); }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  async function handleCreate() {
    if (!newClinicId.trim()) { toast.error("Clinic ID is required"); return; }
    if (newReason.trim().length > 1000) { toast.error("Reason must be 1,000 characters or fewer"); return; }
    setCreating(true);
    const res = await createDeletionRequest({ clinicId: newClinicId.trim(), reason: newReason.trim() || undefined });
    if (res.ok) {
      toast.success("Deletion request created");
      setShowCreate(false); setNewClinicId(""); setNewReason("");
      void fetchRequests();
    } else {
      toast.error("Failed to create request");
    }
    setCreating(false);
  }

  async function handleStatus(id: string, status: string) {
    setUpdatingId(id);
    const res = await setDeletionRequestStatus(id, status);
    if (res.ok) { toast.success(`Request ${status}`); void fetchRequests(); }
    else toast.error("Failed to update status");
    setUpdatingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">GDPR & Data Tools</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{total} deletion request{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 text-xs">+ New Request</Button>
      </div>

      <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
        <SelectTrigger className="h-9 w-44 rounded-lg bg-card text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_160px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span><span>Reason</span><span>Status</span><span>Requested</span><span>Actions</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 px-4 py-3.5">
                {[0,1,2,3,4].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No deletion requests found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map(r => (
              <li key={r.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_160px] items-center gap-3 px-4 py-3 text-xs">
                <div>
                  <p className="font-medium text-foreground">{r.clinic.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/{r.clinic.slug}</p>
                </div>
                <span className="truncate text-muted-foreground">{r.reason ?? "—"}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[r.status] ?? ""}`}>{r.status}</span>
                <span className="text-muted-foreground">{fmt(r.createdAt)}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]"
                    onClick={() => downloadClinicData(r.clinic.id)}>
                    <Download className="mr-1 size-3" />Export
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" disabled={updatingId === r.id}
                        onClick={() => handleStatus(r.id, "approved")}
                        className="h-6 px-2 text-[10px] text-blue-600">Approve</Button>
                      <Button variant="outline" size="sm" disabled={updatingId === r.id}
                        onClick={() => handleStatus(r.id, "rejected")}
                        className="h-6 px-2 text-[10px] text-destructive">Reject</Button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <Button variant="outline" size="sm" disabled={updatingId === r.id}
                      onClick={() => handleStatus(r.id, "completed")}
                      className="h-6 px-2 text-[10px] text-green-600">Complete</Button>
                  )}
                  {updatingId === r.id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                </div>
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">New Deletion Request</p>
              <button onClick={() => setShowCreate(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Clinic ID" value={newClinicId} onChange={e => setNewClinicId(e.target.value)} className="h-9 text-sm" />
              <textarea rows={3} placeholder="Reason (optional)" value={newReason} onChange={e => setNewReason(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button onClick={handleCreate} disabled={creating} className="h-9">
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
