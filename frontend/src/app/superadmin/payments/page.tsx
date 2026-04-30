"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPayments, createPayment } from "@/services/superadmin.service";
import type { PaymentItem } from "@/services/types/superadmin.types";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground",
};

export default function PaymentsPage() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newClinicId, setNewClinicId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPlan, setNewPlan] = useState("starter");
  const [newStatus, setNewStatus] = useState("paid");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const res = await listPayments({ page, limit: 20, search: search.trim() || undefined });
    if (res.ok) { setItems(res.data.items); setTotal(res.data.total); setTotalPages(res.data.totalPages); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { void fetchPayments(); }, [fetchPayments]);

  async function handleCreate() {
    const amt = parseFloat(newAmount);
    if (!newClinicId.trim()) { toast.error("Clinic ID is required"); return; }
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid positive amount"); return; }
    if (amt > 1000000) { toast.error("Amount cannot exceed ₹10,00,000"); return; }
    if (newDesc.trim().length > 500) { toast.error("Description must be 500 characters or fewer"); return; }
    setCreating(true);
    const res = await createPayment({ clinicId: newClinicId.trim(), amount: Math.round(amt * 100), plan: newPlan, status: newStatus, description: newDesc.trim() || undefined });
    if (res.ok) {
      toast.success("Payment record created");
      setShowCreate(false); setNewClinicId(""); setNewAmount(""); setNewDesc("");
      void fetchPayments();
    } else {
      toast.error("Failed to create payment record");
    }
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice & Payment History</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{total} record{total !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 text-xs">+ Add Record</Button>
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by clinic…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-9 rounded-lg bg-card pl-8 text-sm" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Clinic</span><span>Amount</span><span>Plan</span><span>Status</span><span>Date</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 px-4 py-3.5">
                {[0,1,2,3,4].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No payment records found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map(p => (
              <li key={p.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-3 px-4 py-3 text-xs">
                <div>
                  <p className="font-medium text-foreground">{p.clinic.name}</p>
                  {p.description && <p className="truncate text-[11px] text-muted-foreground">{p.description}</p>}
                </div>
                <span className="font-semibold tabular-nums text-foreground">{fmtAmount(p.amount)}</span>
                <span className="capitalize text-muted-foreground">{p.plan}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[p.status] ?? STATUS_STYLES.paid}`}>{p.status}</span>
                <span className="text-muted-foreground">{fmt(p.createdAt)}</span>
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
              <p className="font-semibold text-foreground">Add Payment Record</p>
              <button onClick={() => setShowCreate(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Clinic ID" value={newClinicId} onChange={e => setNewClinicId(e.target.value)} className="h-9 text-sm" />
              <Input type="number" placeholder="Amount (₹)" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="h-9 text-sm" />
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="h-9 text-sm" />
              <Button onClick={handleCreate} disabled={creating} className="h-9">
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}Create Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
