"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listCustomPlans,
  createCustomPlan,
  updateCustomPlan,
  deleteCustomPlan,
} from "@/services/superadmin.service";
import type { CustomPlan } from "@/services/types/superadmin.types";

function fmtPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const DEFAULT_FEATURES = {
  publicBooking: false,
  whatsappNotifications: false,
  invoicing: true,
  reports: true,
};

type PlanForm = {
  name: string;
  description: string;
  price: string;
  annualPrice: string;
  maxPatients: string;
  maxUsers: string;
  features: Record<string, boolean>;
  displayFeatures: string;
  highlighted: boolean;
  ctaText: string;
  sortOrder: string;
};

function emptyForm(): PlanForm {
  return {
    name: "", description: "", price: "", annualPrice: "",
    maxPatients: "", maxUsers: "",
    features: { ...DEFAULT_FEATURES },
    displayFeatures: "",
    highlighted: false,
    ctaText: "Start free trial",
    sortOrder: "0",
  };
}

function InlinePrice({ plan, onSave }: { plan: CustomPlan; onSave: (paise: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(plan.price / 100));
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) { toast.error("Invalid price"); return; }
    if (n > 100000) { toast.error("Price cannot exceed ₹1,00,000/month"); return; }
    setSaving(true);
    await onSave(Math.round(n * 100));
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-bold text-foreground">₹</span>
        <input
          autoFocus
          type="number"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-24 rounded border border-primary bg-background px-2 py-0.5 text-xl font-bold text-foreground outline-none"
        />
        <button onClick={() => void save()} disabled={saving} className="text-primary hover:text-primary/80 disabled:opacity-50">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
        <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(String(plan.price / 100)); setEditing(true); }}
      className="group flex items-baseline gap-0.5"
      title="Click to edit price"
    >
      <span className="text-2xl font-bold text-foreground">{fmtPrice(plan.price)}</span>
      <span className="text-xs font-normal text-muted-foreground">/mo</span>
      {plan.annualPrice != null && (
        <span className="ml-1.5 text-xs text-muted-foreground">({fmtPrice(plan.annualPrice)} annual)</span>
      )}
      <Pencil className="ml-1.5 size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function CustomPlansPage() {
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  async function fetchPlans() {
    setLoading(true);
    const res = await listCustomPlans();
    if (res.ok) setPlans(res.data);
    setLoading(false);
  }

  useEffect(() => { void fetchPlans(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(plan: CustomPlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price / 100),
      annualPrice: plan.annualPrice != null ? String(plan.annualPrice / 100) : "",
      maxPatients: plan.maxPatients != null ? String(plan.maxPatients) : "",
      maxUsers: plan.maxUsers != null ? String(plan.maxUsers) : "",
      features: { ...DEFAULT_FEATURES, ...(plan.features as Record<string, boolean>) },
      displayFeatures: plan.displayFeatures.join("\n"),
      highlighted: plan.highlighted,
      ctaText: plan.ctaText ?? "",
      sortOrder: String(plan.sortOrder),
    });
    setShowModal(true);
  }

  async function handleToggleActive(plan: CustomPlan) {
    setTogglingId(plan.id);
    const res = await updateCustomPlan(plan.id, { isActive: !plan.isActive });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, isActive: !plan.isActive } : p));
      toast.success(plan.isActive ? "Plan hidden from landing page" : "Plan is now visible on landing page");
    } else {
      toast.error("Failed to update plan visibility");
    }
    setTogglingId(null);
  }

  async function handleInlinePrice(plan: CustomPlan, paise: number) {
    const res = await updateCustomPlan(plan.id, { price: paise });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, price: paise } : p));
      toast.success("Price updated");
    } else {
      toast.error("Failed to update price");
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Plan name required"); return; }
    if (form.name.trim().length > 100) { toast.error("Plan name must be 100 characters or fewer"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { toast.error("Enter a valid price (0 or more)"); return; }
    if (price > 100000) { toast.error("Price cannot exceed ₹1,00,000/month"); return; }
    const annualPrice = form.annualPrice ? parseFloat(form.annualPrice) : undefined;
    if (annualPrice !== undefined && (isNaN(annualPrice) || annualPrice < 0)) { toast.error("Enter a valid annual price"); return; }
    const maxPat = form.maxPatients ? parseInt(form.maxPatients, 10) : undefined;
    const maxUsr = form.maxUsers ? parseInt(form.maxUsers, 10) : undefined;
    if (maxPat !== undefined && (isNaN(maxPat) || maxPat <= 0)) { toast.error("Max patients must be a positive number"); return; }
    if (maxUsr !== undefined && (isNaN(maxUsr) || maxUsr <= 0)) { toast.error("Max users must be a positive number"); return; }
    const sortOrder = form.sortOrder ? parseInt(form.sortOrder, 10) : 0;
    const displayFeatures = form.displayFeatures.split("\n").map((s) => s.trim()).filter(Boolean);

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Math.round(price * 100),
      annualPrice: annualPrice != null ? Math.round(annualPrice * 100) : undefined,
      maxPatients: maxPat,
      maxUsers: maxUsr,
      features: form.features,
      displayFeatures,
      highlighted: form.highlighted,
      ctaText: form.ctaText.trim() || undefined,
      sortOrder,
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
    setDeletingId(id);
    setConfirmDelete(null);
    const res = await deleteCustomPlan(id);
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success("Plan deleted");
    } else {
      toast.error("Failed to delete plan");
    }
    setDeletingId(null);
  }

  function toggleFeature(key: string) {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  }

  const activePlans = plans.filter((p) => p.isActive);
  const hiddenPlans = plans.filter((p) => !p.isActive);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plans</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activePlans.length} visible on landing page · {hiddenPlans.length} hidden
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate} className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5" />New Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Zap className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No plans yet.</p>
          <Button size="sm" onClick={openCreate} className="h-8 text-xs">Create your first plan</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activePlans.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Visible on landing page
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    confirmDelete={confirmDelete}
                    deletingId={deletingId}
                    togglingId={togglingId}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleActive}
                    onInlinePrice={handleInlinePrice}
                  />
                ))}
              </div>
            </section>
          )}
          {hiddenPlans.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Hidden from landing page
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {hiddenPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    confirmDelete={confirmDelete}
                    deletingId={deletingId}
                    togglingId={togglingId}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleActive}
                    onInlinePrice={handleInlinePrice}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {confirmDelete && <div className="fixed inset-0 z-10" onClick={() => setConfirmDelete(null)} />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-foreground">{editingId ? "Edit Plan" : "New Plan"}</p>
              <button onClick={() => setShowModal(false)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <div className="flex flex-col gap-4">

              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Basic</p>
                <Input
                  placeholder="Plan name (e.g. Clinic)"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder="CTA button text (e.g. Start free trial)"
                  value={form.ctaText}
                  onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                  className="h-9 text-sm"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, highlighted: !p.highlighted }))}
                    className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
                      form.highlighted
                        ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "border-border text-muted-foreground hover:border-amber-300"
                    }`}
                  >
                    <Star className={`size-3.5 ${form.highlighted ? "fill-amber-400 text-amber-400" : ""}`} />
                    {form.highlighted ? "Highlighted (recommended)" : "Mark as highlighted"}
                  </button>
                  <Input
                    type="number"
                    placeholder="Sort order"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="h-9 w-28 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Monthly price (₹)"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Annual price/mo (₹, optional)"
                    value={form.annualPrice}
                    onChange={(e) => setForm((p) => ({ ...p, annualPrice: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Max patients"
                    value={form.maxPatients}
                    onChange={(e) => setForm((p) => ({ ...p, maxPatients: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max users"
                    value={form.maxUsers}
                    onChange={(e) => setForm((p) => ({ ...p, maxUsers: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Landing page bullet points
                </p>
                <textarea
                  placeholder={"One feature per line, e.g.:\n1 doctor\n500 patients\nPublic booking page"}
                  value={form.displayFeatures}
                  onChange={(e) => setForm((p) => ({ ...p, displayFeatures: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Feature flags
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(form.features).map(([key, enabled]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFeature(key)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                        enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="h-9">
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan, confirmDelete, deletingId, togglingId,
  onEdit, onDelete, onToggle, onInlinePrice,
}: {
  plan: CustomPlan;
  confirmDelete: string | null;
  deletingId: string | null;
  togglingId: string | null;
  onEdit: (plan: CustomPlan) => void;
  onDelete: (id: string) => void;
  onToggle: (plan: CustomPlan) => void;
  onInlinePrice: (plan: CustomPlan, paise: number) => Promise<void>;
}) {
  return (
    <div className={`relative rounded-xl border bg-card p-5 shadow-sm transition-opacity ${
      plan.highlighted ? "border-amber-400/60 ring-1 ring-amber-400/40" : "border-border"
    } ${!plan.isActive ? "opacity-60" : ""}`}>
      {plan.highlighted && (
        <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
          <Star className="size-2.5 fill-amber-900" />Recommended
        </span>
      )}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{plan.name}</p>
          {plan.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{plan.description}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            onClick={() => onToggle(plan)}
            disabled={togglingId === plan.id}
            title={plan.isActive ? "Hide from landing page" : "Show on landing page"}
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {togglingId === plan.id
              ? <Loader2 className="size-3.5 animate-spin" />
              : plan.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />
            }
          </button>
          <button
            onClick={() => onEdit(plan)}
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            disabled={deletingId === plan.id}
            title={confirmDelete === plan.id ? "Click again to confirm" : "Delete plan"}
            className={`flex size-7 items-center justify-center rounded transition-colors disabled:opacity-50 ${
              confirmDelete === plan.id
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-destructive"
            }`}
          >
            {deletingId === plan.id
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Trash2 className="size-3.5" />
            }
          </button>
        </div>
      </div>

      <div className="mb-3">
        <InlinePrice plan={plan} onSave={(paise) => onInlinePrice(plan, paise)} />
      </div>

      {plan.displayFeatures.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1">
          {plan.displayFeatures.slice(0, 4).map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Check className="size-3 shrink-0 text-primary" />{f}
            </li>
          ))}
          {plan.displayFeatures.length > 4 && (
            <li className="text-[11px] text-muted-foreground/60">+{plan.displayFeatures.length - 4} more</li>
          )}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {plan.maxPatients != null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">≤{plan.maxPatients} patients</span>
        )}
        {plan.maxUsers != null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">≤{plan.maxUsers} users</span>
        )}
        {Object.entries(plan.features as Record<string, boolean>)
          .filter(([, v]) => v)
          .map(([k]) => (
            <span key={k} className="rounded-full bg-primary/10 px-2 py-0.5 capitalize text-primary">
              {k.replace(/([A-Z])/g, " $1").trim()}
            </span>
          ))}
      </div>

      {plan.ctaText && (
        <p className="mt-3 text-[11px] text-muted-foreground">CTA: {plan.ctaText}</p>
      )}
    </div>
  );
}
