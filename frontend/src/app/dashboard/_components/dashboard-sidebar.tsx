"use client";

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  CreditCard,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardNav } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { postLogout } from "@/services/auth.service";
import {
  createUserClinic,
  getUserClinics,
  switchLocation,
  type OwnedClinicSummary,
} from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";
import { useUiStore } from "@/stores/ui-store";

import { useDashboardSession } from "../_hooks/use-dashboard-session";

function deriveSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function DashboardSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const {
    session,
    clinicName,
    clinicSlug,
    clinicId,
    displayName,
    roleLabel,
    initials,
  } = useDashboardSession();
  const signIn = useClinicStore((s) => s.signIn);
  const signOut = useClinicStore((s) => s.signOut);
  const subscription = useClinicStore((s) => s.subscription);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  const planLabel = (() => {
    if (!subscription) return null;
    if (subscription.billingStatus === "trial") return "Trial";
    if (subscription.billingStatus === "unpaid") return "Unpaid";
    if (subscription.billingStatus === "cancelled") return "Cancelled";
    const p = subscription.plan;
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : null;
  })();

  const [clinics, setClinics] = useState<OwnedClinicSummary[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newClinicName, setNewClinicName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const newClinicSlug = useMemo(
    () => deriveSlug(newClinicName),
    [newClinicName],
  );
  const multiClinicEnabled = clinics.some((c) => c.multiClinicEnabled);

  useEffect(() => {
    getUserClinics().then((r) => {
      if (r.ok) setClinics(r.data.clinics);
    });
  }, []);

  async function handleLogout() {
    try {
      await postLogout();
    } catch {
      // Still clear client session when the API isn't reachable
    }
    signOut();
    toast.success(t("common.signedOut"));
    router.push("/login");
  }

  async function handleSwitch(targetId: string) {
    if (targetId === clinicId) return;
    setSwitching(targetId);
    const res = await switchLocation(targetId);
    setSwitching(null);
    if (!res.ok) {
      toast.error("Failed to switch clinic");
      return;
    }
    const { clinic } = res.data;
    if (session) {
      signIn({
        ...session,
        clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug },
      });
    }
    toast.success(`Switched to ${clinic.name}`);
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newClinicName.trim() || !newPhone.trim()) return;
    setCreating(true);
    const res = await createUserClinic({
      clinicName: newClinicName.trim(),
      phone: newPhone.trim(),
      slug: newClinicSlug,
    });
    setCreating(false);
    if (!res.ok) {
      const msg =
        (res.data as { error?: string }).error ?? "Could not create clinic";
      toast.error(msg);
      return;
    }
    toast.success(`${res.data.clinic.name} created! Switching now…`);
    setShowCreate(false);
    setNewClinicName("");
    setNewPhone("");
    getUserClinics().then((r) => {
      if (r.ok) setClinics(r.data.clinics);
    });
    handleSwitch(res.data.clinic.id);
  }

  return (
    <>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-linear md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "pt-3 pb-2",
            collapsed ? "px-2" : "px-3",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Switch clinic"
                title={collapsed ? clinicName : undefined}
                className={cn(
                  "flex items-center rounded-md text-left transition-colors hover:bg-sidebar-accent",
                  collapsed
                    ? "mx-auto size-10 justify-center"
                    : "w-full gap-2 px-2 py-2",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand">
                  <Stethoscope className="size-4" />
                </span>
                {!collapsed && (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-[13px] font-semibold text-sidebar-foreground">
                        {clinicName}
                      </span>
                      {planLabel && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {planLabel}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={8}
              className="w-64"
            >
              <DropdownMenuLabel className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Clinics
              </DropdownMenuLabel>
              {clinics.map((c) => {
                const isActive = c.id === clinicId;
                const isLoading = switching === c.id;
                return (
                  <DropdownMenuItem
                    key={c.id}
                    disabled={isActive || isLoading}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSwitch(c.id);
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-card">
                      <Building2 className="size-3.5 text-muted-foreground" />
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        isActive && "font-medium text-brand",
                      )}
                    >
                      {c.name}
                    </span>
                    {isLoading ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Check
                        className={cn(
                          "size-3.5 shrink-0",
                          isActive ? "text-brand" : "opacity-0",
                        )}
                      />
                    )}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              {multiClinicEnabled ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowCreate(true);
                  }}
                  className="gap-2 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border">
                    <Plus className="size-3.5 text-muted-foreground" />
                  </span>
                  <span className="text-muted-foreground">Add clinic</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => router.push("/dashboard/subscription")}
                  className="gap-2 text-sm text-muted-foreground"
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
        </div>

        <nav
          className={cn(
            "flex flex-1 flex-col gap-1 pb-4",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {dashboardNav.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            const label = t(item.i18nKey);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  collapsed
                    ? "mx-auto size-10 justify-center"
                    : "h-9 gap-2.5 px-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-brand"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "flex flex-col gap-2 border-t border-sidebar-border py-3",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {!collapsed && (
            <Button
              variant="outline"
              disabled={!clinicSlug}
              onClick={() => {
                if (!clinicSlug) return;
                const url = `${window.location.origin}/book/${clinicSlug}`;
                navigator.clipboard?.writeText(url).then(() =>
                  toast.success("Booking link copied"),
                );
              }}
              className="h-9 justify-start gap-2 rounded-md border-sidebar-border bg-transparent px-3 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-40"
            >
              <Link2 className="size-3.5" />
              {t("sidebar.bookingLink")}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={displayName}
                title={collapsed ? displayName : undefined}
                className={cn(
                  "flex items-center rounded-md text-left transition-colors hover:bg-sidebar-accent",
                  collapsed
                    ? "mx-auto size-10 justify-center"
                    : "w-full gap-2.5 px-2 py-2",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                  {initials}
                </span>
                {!collapsed && (
                  <>
                    <div className="flex flex-1 flex-col overflow-hidden leading-tight">
                      <span className="truncate text-[13px] font-medium text-sidebar-foreground">
                        {displayName}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {session?.email ?? roleLabel}
                      </span>
                    </div>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={8}
              className="w-64"
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                    {initials}
                  </span>
                  <div className="flex flex-1 flex-col overflow-hidden leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.email ?? roleLabel}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              {subscription?.plan !== "pro" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => router.push("/dashboard/subscription")}
                    className="gap-2"
                  >
                    <Sparkles className="size-4 shrink-0" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push("/dashboard/settings")}
                className="gap-2"
              >
                <BadgeCheck className="size-4 shrink-0" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => router.push("/dashboard/billing")}
                className="gap-2"
              >
                <CreditCard className="size-4 shrink-0" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => router.push("/dashboard/notifications")}
                className="gap-2"
              >
                <Bell className="size-4 shrink-0" />
                Notifications
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="gap-2">
                <LogOut className="size-4 shrink-0" />
                {t("common.logOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

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
                value={newClinicName}
                onChange={(e) => setNewClinicName(e.target.value)}
              />
              {newClinicSlug && (
                <p className="text-xs text-muted-foreground">
                  URL:{" "}
                  <span className="font-medium text-foreground">
                    {newClinicSlug}
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nc-phone">Phone</Label>
              <div className="flex h-10 items-stretch overflow-hidden rounded-md ring-1 ring-input focus-within:ring-2 focus-within:ring-ring/50">
                <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <input
                  id="nc-phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!newClinicName.trim() || !newPhone.trim() || creating}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating…
                </>
              ) : (
                "Create clinic"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
