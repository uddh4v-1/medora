"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { useClinicStore } from "@/stores/clinic-store";
import { exitImpersonation } from "@/services/superadmin.service";

export function ImpersonationBanner() {
  const router = useRouter();
  const { isImpersonating, clinicName } = useDashboardSession();
  const signOut = useClinicStore((s) => s.signOut);
  const [exiting, setExiting] = useState(false);

  if (!isImpersonating) return null;

  async function handleExit() {
    setExiting(true);
    const res = await exitImpersonation();
    if (res.ok) {
      signOut();
      router.replace("/superadmin/clinics");
    } else {
      toast.error("Could not exit impersonation");
      setExiting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0" />
        <span>
          Viewing as <strong>{clinicName}</strong> — SuperAdmin impersonation session
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1.5 rounded-md bg-amber-950/10 px-3 py-1 text-xs font-semibold transition hover:bg-amber-950/20 disabled:opacity-60"
      >
        {exiting ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <LogOut className="size-3" />
        )}
        Exit
      </button>
    </div>
  );
}
