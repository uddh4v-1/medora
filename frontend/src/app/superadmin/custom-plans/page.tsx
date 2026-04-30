"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCustomPlans, createCustomPlan, updateCustomPlan, deleteCustomPlan } from "@/services/superadmin.service";
import type { CustomPlan } from "@/services/types/superadmin.types";

function fmtPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const DEFAULT_FEATURES = { publicBooking: false, whatsappNotifications: false, invoicing: true, reports: true };

type PlanForm = {
  name: string;
  description: string;
  price: string;
  maxPatients: string;
  maxUsers: string;
  features: Record<string, boolean>;
};

const emptyForm = (): PlanForm => ({
  name: "", description: "", price: "", maxPatients: "", maxUsers: "", features: { ...DEFAULT_FEATURES },
});

export default function CustomPlansPage() {
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());

  async function fetchPlans() {
    setLoading(true);
    const res = await listCustomPlans();
    if (res.ok) setPlans(res.data);
    setLoading(false);
  }

  useEffect(() => { void fetchPlans(); }, []);

  function openCreate() {
    setEditingId(null); setForm(emptyForm()); setShowModal(true);
  }

  function openEdit(plan: CustomPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price / 100),
      maxPatients: plan.maxPatients != null ? String(plan.maxPatients) : "",
      maxUsers: plan.maxUsers != null ? String(plan.maxUsers) : "",
      features: { ...DEFAULT_FEATURES, ...(plan.features as Record<string, boolean>) },
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Plan name required"); return; }
    if (form.name.trim().length > 100) { toast.error("Plan name must be 100 characters or fewer"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { toast.error("Enter a valid price (0 or more)"); return; }
    if (price > 100000) { toast.error("Price cannot exceed ₹1,00,000/month"); return; }
    const maxPat = form.maxPatients ? parseInt(form.maxPatients, 10) : undefined;
    const maxUsr = form.maxUsers ? parseInt(form.maxUsers, 10) : undefined;
    if (maxPat !== undefined && (isNaN(maxPat) || maxPat <= 0)) { toast.error("Max patients must be a positive number"); return; }
    if (maxUsr !== undefined && (isNaN(maxUsr) || maxUsr <= 0)) { toast.error("Max users must be a positive number"); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Math.round(price * 100),
      maxPatients: maxPat,
      maxUsers: maxUsr,
      features: form.features,
    };
    const res = editingId
      ? await updateCustomPlan(editingId, payload)
      : await createCustomPlan(payload);
    if (res.ok) {
      toast.success(editingId ? "Plan updated" : "Plan created");
      setShowModal(false);
      void fetchPlans();
    } else {
      toast.error("Failed to save plan");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setDeletingId(id); setConfirmDelete(null);
    const res = await deleteCustomPlan(id);
    if (res.ok) { setPlans(prev => prev.filter(p => p.id !== id)); toast.success("Plan deleted"); }
    else toast.error("Failed to delete plan");
    setDeletingId(null);
  }

  function toggleFeature(key: string) {
    setForm(prev => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custom Plan Builder</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{plans.length} custom plan{plans.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-xs"><Plus className="size-3.5" />New Plan</Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Zap className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No custom plans yet.</p>
          <Button size="sm" onClick={openCreate} className="h-8 text-xs">Create your first plan</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.id} className="relative rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  {plan.description && <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="size-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEdit(plan)}>
                    <Pencil className="size-3" />
                  </Button>
                  <Button variant="ghost" size="sm" disabled={deletingId === plan.id}
                    onClick={() => handleDelete(plan.id)}
                    className={`size-7 p-0 ${confirmDelete === plan.id ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-destructive"}`}
                    title={confirmDelete === plan.id ? "Click again to confirm" : "Delete"}>
                    {deletingId === plan.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                  </Button>
                </div>
              </div>
              <p className="mb-3 text-2xl font-bold text-foreground">{fmtPrice(plan.price)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {plan.maxPatients != null && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">≤{plan.maxPatients} patients</span>}
                {plan.maxUsers != null && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">≤{plan.maxUsers} users</span>}
                {Object.entries(plan.features as Record<string, boolean>).filter(([,v]) => v).map(([k]) => (
                  <span key={k} className="rounded-full bg-primary/10 px-2 py-0.5 capitalize text-primary">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && <div className="fixed inset-0 z-10" onClick={() => setConfirmDelete(null)} />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">{editingId ? "Edit Plan" : "New Custom Plan"}</p>
              <button onClick={() => setShowModal(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Plan name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
              <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-9 text-sm" />
              <Input type="number" placeholder="Price per month (₹)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="h-9 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Max patients" value={form.maxPatients} onChange={e => setForm(p => ({ ...p, maxPatients: e.target.value }))} className="h-9 text-sm" />
                <Input type="number" placeholder="Max users" value={form.maxUsers} onChange={e => setForm(p => ({ ...p, maxUsers: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">Features</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(form.features).map(([key, enabled]) => (
                    <button key={key} onClick={() => toggleFeature(key)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-9 mt-1">
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}{editingId ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
