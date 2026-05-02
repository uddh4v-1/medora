"use client";

import { Building2, Check, ChevronDown, Loader2, Plus, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getUserClinics,
  switchLocation,
  createUserClinic,
  type OwnedClinicSummary,
} from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";

function deriveSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function LocationSwitcher({ currentClinicId }: { currentClinicId: string | undefined }) {
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const session = useClinicStore((s) => s.session);

  const [clinics, setClinics] = useState<OwnedClinicSummary[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create-clinic form state
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const slug = useMemo(() => deriveSlug(clinicName), [clinicName]);

  const multiClinicEnabled = clinics.some((c) => c.multiClinicEnabled);

  useEffect(() => {
    getUserClinics().then((r) => {
      if (r.ok) setClinics(r.data.clinics);
    });
  }, []);

  if (clinics.length === 0) return null;

  async function handleSwitch(clinicId: string) {
    if (clinicId === currentClinicId) return;
    setSwitching(clinicId);
    const res = await switchLocation(clinicId);
    setSwitching(null);
    if (!res.ok) {
      toast.error("Failed to switch clinic");
      return;
    }
    const { clinic } = res.data;
    if (session) {
      signIn({ ...session, clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug } });
    }
    toast.success(`Switched to ${clinic.name}`);
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicName.trim() || !phone.trim()) return;
    setCreating(true);
    const res = await createUserClinic({ clinicName: clinicName.trim(), phone: phone.trim(), slug });
    setCreating(false);
    if (!res.ok) {
      const msg = (res.data as { error?: string }).error ?? "Could not create clinic";
      toast.error(msg);
      return;
    }
    toast.success(`${res.data.clinic.name} created! Switching now…`);
    setShowCreate(false);
    setClinicName("");
    setPhone("");
    // Refresh the list and switch to the new clinic
    getUserClinics().then((r) => { if (r.ok) setClinics(r.data.clinics); });
    handleSwitch(res.data.clinic.id);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Building2 className="size-3 shrink-0" />
            <span className="flex-1 truncate">Switch clinic</span>
            <ChevronDown className="size-3 shrink-0 opacity-60" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          {clinics.map((c) => {
            const isActive = c.id === currentClinicId;
            const isLoading = switching === c.id;
            return (
              <DropdownMenuItem
                key={c.id}
                disabled={isActive || isLoading}
                onSelect={() => handleSwitch(c.id)}
                className="flex items-start gap-2 py-2"
              >
                {isLoading ? (
                  <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <Check className={cn("mt-0.5 size-3.5 shrink-0", isActive ? "text-brand" : "opacity-0")} />
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className={cn("truncate text-sm font-medium", isActive && "text-brand")}>
                    {c.name}
                  </span>
                  {c.city && (
                    <span className="truncate text-xs text-muted-foreground">{c.city}</span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />

          {multiClinicEnabled ? (
            <DropdownMenuItem onSelect={() => setShowCreate(true)} className="gap-2 text-xs">
              <Plus className="size-3.5" />
              Add new clinic
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => router.push("/dashboard/subscription")}
              className="gap-2 text-xs text-muted-foreground"
            >
              <Lock className="size-3.5 shrink-0" />
              <span className="flex-1">Multiple clinics</span>
              <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                Upgrade
              </span>
              <ArrowRight className="size-3 shrink-0 opacity-50" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create clinic dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a new clinic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-name">Clinic name</Label>
              <Input
                id="nc-name"
                placeholder="Sunrise Health Clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
              {slug && (
                <p className="text-xs text-muted-foreground">
                  URL: <span className="font-medium text-foreground">{slug}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-phone">Phone</Label>
              <div className="flex h-10 items-stretch overflow-hidden rounded-md ring-1 ring-input focus-within:ring-2 focus-within:ring-ring/50">
                <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <input
                  id="nc-phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!clinicName.trim() || !phone.trim() || creating}
              className="w-full"
            >
              {creating ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : "Create clinic"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
