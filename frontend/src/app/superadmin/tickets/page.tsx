"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, TicketIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTickets, getTicket, createTicket, replyTicket, setTicketStatus } from "@/services/superadmin.service";
import type { TicketListItem, TicketDetail } from "@/services/types/superadmin.types";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
};
const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

function Badge({ label, style }: { label: string; style: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}>{label.replace("_", " ")}</span>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TicketsPage() {
  const [items, setItems] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newClinicId, setNewClinicId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const res = await listTickets({ page, limit: 20, search: search.trim() || undefined, status: statusFilter === "all" ? undefined : statusFilter });
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); setTotalPages(res.data.totalPages); }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { void fetchTickets(); }, [fetchTickets]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    const res = await getTicket(id);
    if (res.ok) setSelected(res.data);
    setDetailLoading(false);
  }

  async function handleReply() {
    if (!reply.trim() || !selected) return;
    if (reply.trim().length > 5000) { toast.error("Reply must be 5,000 characters or fewer"); return; }
    setReplying(true);
    const res = await replyTicket(selected.id, reply.trim());
    if (res.ok) { toast.success("Reply sent"); setReply(""); await openDetail(selected.id); }
    else toast.error("Failed to send reply");
    setReplying(false);
  }

  async function handleStatus(status: string) {
    if (!selected) return;
    setUpdatingStatus(true);
    const res = await setTicketStatus(selected.id, status);
    if (res.ok) { toast.success(`Status → ${status}`); setSelected(prev => prev ? { ...prev, status } : prev); void fetchTickets(); }
    else toast.error("Failed to update status");
    setUpdatingStatus(false);
  }

  async function handleCreate() {
    if (!newClinicId.trim() || !newSubject.trim() || !newMessage.trim()) { toast.error("All fields required"); return; }
    if (newSubject.trim().length > 200) { toast.error("Subject must be 200 characters or fewer"); return; }
    if (newMessage.trim().length > 5000) { toast.error("Message must be 5,000 characters or fewer"); return; }
    setCreating(true);
    const res = await createTicket({ clinicId: newClinicId.trim(), subject: newSubject.trim(), priority: newPriority, message: newMessage.trim() });
    if (res.ok) { toast.success("Ticket created"); setShowCreate(false); setNewClinicId(""); setNewSubject(""); setNewMessage(""); void fetchTickets(); }
    else toast.error("Failed to create ticket");
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TicketIcon className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{total} ticket{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 text-xs">+ New Ticket</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tickets…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-9 w-60 pl-8 text-sm bg-card rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-40 rounded-lg bg-card text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* List */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span>Ticket</span><span>Priority</span><span>Status</span>
          </div>
          {loading ? (
            <div className="divide-y divide-border/60">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="grid grid-cols-3 gap-3 px-4 py-3.5">{[0,1,2].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}</div>)}</div>
          ) : items.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">No tickets found.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map(t => (
                <li key={t.id} onClick={() => openDetail(t.id)}
                  className={`grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 cursor-pointer px-4 py-3 text-xs transition-colors hover:bg-muted/20 ${selected?.id === t.id ? "bg-primary/5" : ""}`}>
                  <div>
                    <p className="truncate font-medium text-foreground">{t.subject}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.clinic.name} · {fmt(t.createdAt)}</p>
                  </div>
                  <Badge label={t.priority} style={PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.medium} />
                  <Badge label={t.status} style={STATUS_STYLES[t.status] ?? STATUS_STYLES.open} />
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

        {/* Detail */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {detailLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : !selected ? (
            <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">Select a ticket to view</p>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{selected.subject}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selected.clinic.name} · {fmt(selected.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {["open","in_progress","resolved","closed"].filter(s => s !== selected.status).map(s => (
                      <Button key={s} variant="outline" size="sm" disabled={updatingStatus} onClick={() => handleStatus(s)}
                        className="h-6 px-2 text-[10px] capitalize">{s.replace("_"," ")}</Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64 divide-y divide-border/60 px-5">
                {selected.messages.map(m => (
                  <div key={m.id} className={`py-3 text-xs ${m.isStaff ? "text-right" : ""}`}>
                    <span className={`inline-block rounded-lg px-3 py-1.5 text-xs ${m.isStaff ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m.body}</span>
                    <p className="mt-1 text-[10px] text-muted-foreground">{m.isStaff ? "Staff" : "Clinic"} · {fmt(m.createdAt)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4 flex gap-2">
                <Input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleReply(); }}} placeholder="Write a reply…" className="h-9 flex-1 text-sm" />
                <Button onClick={handleReply} disabled={replying || !reply.trim()} className="h-9 px-4 text-xs">
                  {replying ? <Loader2 className="size-3 animate-spin" /> : "Reply"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">New Support Ticket</p>
              <button onClick={() => setShowCreate(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Clinic ID" value={newClinicId} onChange={e => setNewClinicId(e.target.value)} className="h-9 text-sm" />
              <Input placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="h-9 text-sm" />
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <textarea rows={3} placeholder="Initial message…" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button onClick={handleCreate} disabled={creating} className="h-9">
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}Create Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
