"use client";

import { Building2, Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocations, switchLocation, type LocationSummary } from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";

export function LocationSwitcher({ currentClinicId }: { currentClinicId: string | undefined }) {
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const session = useClinicStore((s) => s.session);

  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    getLocations().then((r) => {
      if (r.ok) setLocations(r.data.locations);
    });
  }, []);

  if (locations.length <= 1) return null;

  async function handleSwitch(loc: LocationSummary) {
    if (loc.id === currentClinicId) return;
    setSwitching(loc.id);
    const res = await switchLocation(loc.id);
    setSwitching(null);
    if (!res.ok) {
      toast.error("Failed to switch location");
      return;
    }
    const { clinic } = res.data;
    if (session) {
      signIn({ ...session, clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug } });
    }
    toast.success(`Switched to ${clinic.name}`);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Building2 className="size-3 shrink-0" />
          <span className="flex-1 truncate">Switch location</span>
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {locations.map((loc) => {
          const isActive = loc.id === currentClinicId;
          const isLoading = switching === loc.id;
          return (
            <DropdownMenuItem
              key={loc.id}
              disabled={isActive || isLoading}
              onSelect={() => handleSwitch(loc)}
              className="flex items-start gap-2 py-2"
            >
              {isLoading ? (
                <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Check className={cn("mt-0.5 size-3.5 shrink-0", isActive ? "text-brand" : "opacity-0")} />
              )}
              <div className="flex flex-col overflow-hidden">
                <span className={cn("truncate text-sm font-medium", isActive && "text-brand")}>
                  {loc.name}
                </span>
                {loc.city && (
                  <span className="truncate text-xs text-muted-foreground">{loc.city}</span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/dashboard/settings/locations")} className="gap-2 text-xs">
          <Plus className="size-3.5" />
          Manage locations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
