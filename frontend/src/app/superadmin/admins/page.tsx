"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listSuperAdmins, createSuperAdmin, deleteSuperAdmin } from "@/services/superadmin.service";
import type { SuperAdminAccount } from "@/services/types/superadmin.types";
import { isValidEmail } from "@/lib/validation";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<SuperAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchAdmins() {
    setLoading(true);
    const res = await listSuperAdmins();
    if (res.ok) setAdmins(res.data);
    setLoading(false);
  }

  useEffect(() => { void fetchAdmins(); }, []);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password.trim()) { toast.error("All fields required"); return; }
    if (name.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (!isValidEmail(email)) { toast.error("Enter a valid email address"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setCreating(true);
    const res = await createSuperAdmin({ name: name.trim(), email: email.trim(), password });
    if (res.ok) {
      toast.success(`${res.data.name} added as SuperAdmin`);
      setAdmins(prev => [...prev, res.data]);
      setShowCreate(false); setName(""); setEmail(""); setPassword("");
    } else {
      toast.error("Failed to create SuperAdmin");
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setDeletingId(id); setConfirmDelete(null);
    const res = await deleteSuperAdmin(id);
    if (res.ok) { setAdmins(prev => prev.filter(a => a.id !== id)); toast.success("SuperAdmin removed"); }
    else toast.error("Failed to remove SuperAdmin");
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">SuperAdmin Accounts</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{admins.length} admin{admins.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 gap-1.5 text-xs">+ Add Admin</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_60px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Name</span><span>Email</span><span>Status</span><span>Joined</span><span />
        </div>
        {loading ? (
          <div className="divide-y divide-border/60">{Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-3 px-4 py-3.5">{[0,1,2,3,4].map(j => <div key={j} className="h-3 animate-pulse rounded bg-muted" />)}</div>
          ))}</div>
        ) : admins.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">No SuperAdmins found.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {admins.map(a => (
              <li key={a.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_60px] items-center gap-3 px-4 py-3 text-xs">
                <div>
                  <p className="font-medium text-foreground">{a.name}</p>
                  {!a.emailVerified && <p className="text-[10px] text-amber-500">Email unverified</p>}
                </div>
                <span className="truncate text-muted-foreground">{a.email}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>{a.status}</span>
                <span className="text-muted-foreground">{fmt(a.createdAt)}</span>
                <Button variant="ghost" size="sm" disabled={deletingId === a.id} onClick={() => handleDelete(a.id)}
                  className={`size-7 p-0 ${confirmDelete === a.id ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-destructive"}`}
                  title={confirmDelete === a.id ? "Click again to confirm" : "Remove"}>
                  {deletingId === a.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmDelete && <div className="fixed inset-0 z-10" onClick={() => setConfirmDelete(null)} />}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">Add SuperAdmin</p>
              <button onClick={() => setShowCreate(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
              <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="h-9 text-sm" />
              <Input type="password" placeholder="Password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} className="h-9 text-sm" />
              <Button onClick={handleCreate} disabled={creating} className="h-9">
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}Create Admin
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
