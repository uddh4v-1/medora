"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPlatformConfig,
  listClinicFlags,
  updateClinicFlags,
  updatePlatformConfig,
} from "@/services/superadmin.service";
import type { ClinicFlagItem, PlatformConfigData } from "@/services/types/superadmin.types";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-500" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`pointer-events-none block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function ConfigPage() {
  // Platform config
  const [platform, setPlatform] = useState<PlatformConfigData | null>(null);
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [bannerDraft, setBannerDraft] = useState("");
  const platformLoaded = useRef(false);

  useEffect(() => {
    getPlatformConfig().then((res) => {
      if (res.ok) {
        setPlatform(res.data);
        setBannerDraft(res.data.bannerMessage ?? "");
        platformLoaded.current = true;
      }
    });
  }, []);

  async function handleMaintenanceToggle(value: boolean) {
    if (!platform) return;
    setSavingPlatform(true);
    const res = await updatePlatformConfig({ maintenanceMode: value });
    if (res.ok) {
      setPlatform(res.data);
      toast.success(value ? "Maintenance mode ON" : "Maintenance mode OFF");
    } else {
      toast.error("Failed to update");
    }
    setSavingPlatform(false);
  }

  async function handleSaveBanner() {
    setSavingPlatform(true);
    const res = await updatePlatformConfig({
      bannerMessage: bannerDraft.trim() || null,
    });
    if (res.ok) {
      setPlatform(res.data);
      toast.success(bannerDraft.trim() ? "Banner saved" : "Banner cleared");
    } else {
      toast.error("Failed to save");
    }
    setSavingPlatform(false);
  }

  // Per-clinic flags
  const [items, setItems] = useState<ClinicFlagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoadingFlags(true);
    const res = await listClinicFlags({ page, limit: 20, search: search.trim() || undefined });
    if (res.ok) {
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoadingFlags(false);
  }, [page, search]);

  useEffect(() => {
    void fetchFlags();
  }, [fetchFlags]);

  async function handleFlagToggle(
    clinic: ClinicFlagItem,
    flag: "publicBooking" | "whatsappNotifications",
  ) {
    const key = `${clinic.id}:${flag}`;
    setToggling(key);
    const newVal = !clinic.flags[flag];
    const res = await updateClinicFlags(clinic.id, { [flag]: newVal });
    if (res.ok) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === clinic.id
            ? { ...c, flags: { ...c.flags, [flag]: newVal } }
            : c,
        ),
      );
    } else {
      toast.error("Failed to update flag");
    }
    setToggling(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Config</h1>
          <p className="text-sm text-muted-foreground">Feature flags and platform settings</p>
        </div>
      </div>

      {/* Platform Settings Card */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3.5">
          <p className="text-sm font-semibold text-foreground">Platform Settings</p>
        </div>
        <div className="divide-y divide-border/60">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                Disables login for all non-SuperAdmin users
              </p>
            </div>
            {platform === null ? (
              <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
            ) : (
              <Toggle
                checked={platform.maintenanceMode}
                onChange={handleMaintenanceToggle}
                disabled={savingPlatform}
              />
            )}
          </div>

          {/* Banner Message */}
          <div className="flex flex-col gap-3 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Dashboard Banner</p>
              <p className="text-xs text-muted-foreground">
                Shows a notification banner in all clinic dashboards. Leave blank to hide.
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={bannerDraft}
                onChange={(e) => setBannerDraft(e.target.value)}
                placeholder="e.g. Scheduled maintenance on May 5th at 2 AM IST"
                className="h-9 text-sm"
                maxLength={500}
              />
              <Button
                size="sm"
                disabled={savingPlatform || platform === null}
                onClick={handleSaveBanner}
                className="h-9 shrink-0 px-4"
              >
                {savingPlatform ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
            {platform?.bannerMessage && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
                Active: &quot;{platform.bannerMessage}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Per-Clinic Feature Flags */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Per-Clinic Feature Flags</p>
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString()} clinic{total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clinics…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-56 rounded-lg bg-card pl-8 text-sm"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-b border-border bg-muted/40 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span>Clinic</span>
            <span>Public Booking</span>
            <span>WhatsApp Notifs</span>
          </div>

          {loadingFlags ? (
            <div className="divide-y divide-border/60">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-5 py-14 text-center text-sm text-muted-foreground">No clinics found.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((clinic) => (
                <li
                  key={clinic.id}
                  className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-5 py-3"
                >
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">{clinic.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">/{clinic.slug}</p>
                  </div>
                  <Toggle
                    checked={clinic.flags.publicBooking}
                    onChange={() => handleFlagToggle(clinic, "publicBooking")}
                    disabled={toggling === `${clinic.id}:publicBooking`}
                  />
                  <Toggle
                    checked={clinic.flags.whatsappNotifications}
                    onChange={() => handleFlagToggle(clinic, "whatsappNotifications")}
                    disabled={toggling === `${clinic.id}:whatsappNotifications`}
                  />
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
      </div>
    </div>
  );
}
