"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { useClinicStore } from "@/stores/clinic-store";

const SUBSCRIPTION_WARNING_DAYS = 7;

export function TrialBanner() {
  const { isImpersonating } = useDashboardSession();
  const subscription = useClinicStore((s) => s.subscription);

  if (isImpersonating) return null;
  if (!subscription) return null;

  const { billingStatus, isTrialExpired, daysRemaining, currentPeriodEnd } = subscription;

  // ── Trial banner ──────────────────────────────────────────────────────────
  if (billingStatus === "trial") {
    if (isTrialExpired) return null;

    const days = daysRemaining ?? 0;
    const urgent = days <= 3;

    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium ${
          urgent ? "bg-amber-500 text-amber-950" : "bg-blue-600 text-white"
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
            urgent ? "bg-amber-950/10 hover:bg-amber-950/20" : "bg-white/15 hover:bg-white/25"
          }`}
        >
          Upgrade now
        </Link>
      </div>
    );
  }

  // ── Active subscription expiry warning ────────────────────────────────────
  if (billingStatus === "active" && currentPeriodEnd) {
    const msLeft = new Date(currentPeriodEnd).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    if (daysLeft > SUBSCRIPTION_WARNING_DAYS || daysLeft <= 0) return null;

    const urgent = daysLeft <= 3;

    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium ${
          urgent ? "bg-amber-500 text-amber-950" : "bg-orange-500 text-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>
            {daysLeft === 1
              ? "Your subscription expires tomorrow."
              : `Your subscription expires in ${daysLeft} days.`}
          </span>
        </div>
        <Link
          href="/dashboard/subscription"
          className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition ${
            urgent ? "bg-amber-950/10 hover:bg-amber-950/20" : "bg-white/15 hover:bg-white/25"
          }`}
        >
          Renew now
        </Link>
      </div>
    );
  }

  return null;
}
