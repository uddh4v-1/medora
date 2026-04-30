"use client";

import { Building2, Loader2, MapPin, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBranch,
  getLocations,
  switchLocation,
  type LocationSummary,
} from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default function LocationsPage() {
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const session = useClinicStore((s) => s.session);
  const currentClinicId = session?.clinic?.id;

  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", slug: "", city: "", address: "" });

  useEffect(() => {
    getLocations().then((r) => {
      if (r.ok) setLocations(r.data.locations);
      setLoading(false);
    });
  }, []);

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.slug.trim()) return;
    setSaving(true);
    const res = await createBranch({
      name: form.name.trim(),
      phone: form.phone.trim(),
      slug: form.slug.trim(),
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error((res.data as { message?: string })?.message ?? "Failed to create location");
      return;
    }
    setLocations((prev) => [...prev, res.data.branch]);
    setForm({ name: "", phone: "", slug: "", city: "", address: "" });
    setShowForm(false);
    toast.success(`${res.data.branch.name} added`);
  }

  async function handleSwitch(loc: LocationSummary) {
    if (loc.id === currentClinicId) return;
    setSwitching(loc.id);
    const res = await switchLocation(loc.id);
    setSwitching(null);
    if (!res.ok) { toast.error("Failed to switch location"); return; }
    const { clinic } = res.data;
    if (session) signIn({ ...session, clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug } });
    toast.success(`Switched to ${clinic.name}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Settings</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your clinic branches. Switch between locations from the sidebar.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-9 gap-1.5 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
        >
          <Plus className="size-4" />
          Add location
        </Button>
      </header>

      {showForm && (
        <Card className="border-brand/30 shadow-brand-glow ring-1 ring-brand/20">
          <CardHeader>
            <CardTitle className="text-base">New branch</CardTitle>
            <CardDescription>This creates a separate clinic linked to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-name">Branch name *</Label>
                <Input
                  id="loc-name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Medora Clinic — Bandra"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-phone">Phone *</Label>
                <Input
                  id="loc-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-slug">
                  Booking URL slug *
                  <span className="ml-1 text-xs text-muted-foreground">(medora.app/book/…)</span>
                </Label>
                <Input
                  id="loc-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  placeholder="medora-bandra"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-city">City</Label>
                <Input
                  id="loc-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Mumbai"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="loc-address">Address</Label>
                <Input
                  id="loc-address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Shop 4, Turner Road, Bandra West"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-9 gap-1.5 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {saving ? "Creating…" : "Create branch"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your locations</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${locations.length} location${locations.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading locations…
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
              <Building2 className="size-8 opacity-30" />
              <p>No branches yet. Add a location to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {locations.map((loc) => {
                const isActive = loc.id === currentClinicId;
                const isRoot = loc.parentClinicId === null;
                const isLoading = switching === loc.id;
                return (
                  <li key={loc.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{loc.name}</p>
                          {isRoot && <Badge variant="secondary" className="text-[10px]">Main</Badge>}
                          {isActive && <Badge className="bg-brand/10 text-brand text-[10px]">Active</Badge>}
                        </div>
                        {(loc.city || loc.address) && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            {[loc.address, loc.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          /book/{loc.slug}
                        </p>
                      </div>
                    </div>
                    {!isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleSwitch(loc)}
                        className="h-8 shrink-0 gap-1.5 text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="size-3.5" />
                        )}
                        Switch
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
