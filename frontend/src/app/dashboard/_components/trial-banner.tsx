"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { useClinicStore } from "@/stores/clinic-store";

export function TrialBanner() {
  const { isImpersonating } = useDashboardSession();
  const subscription = useClinicStore((s) => s.subscription);

  if (isImpersonating) return null;
  if (!subscription) return null;
  if (subscription.billingStatus !== "trial") return null;
  if (subscription.isTrialExpired) return null;

  const days = subscription.daysRemaining ?? 0;
  const urgent = days <= 3;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium ${
        urgent
          ? "bg-amber-500 text-amber-950"
          : "bg-blue-600 text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock className="size-4 shrink-0" />
        <span>
          {days === 0
            ? "Your free trial expires today."
            : `${days} day${days === 1 ? "" : "s"} left in your free trial.`}
        </span>
      </div>
      <Link
        href="/dashboard/subscription"
        className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition ${
          urgent
            ? "bg-amber-950/10 hover:bg-amber-950/20"
            : "bg-white/15 hover:bg-white/25"
        }`}
      >
        Upgrade now
      </Link>
    </div>
  );
}
