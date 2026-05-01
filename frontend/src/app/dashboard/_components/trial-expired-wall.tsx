"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { useClinicStore } from "@/stores/clinic-store";

export function TrialExpiredWall({ children }: { children: ReactNode }) {
  const { isImpersonating } = useDashboardSession();
  const subscription = useClinicStore((s) => s.subscription);
  const pathname = usePathname();

  // Always allow the subscription/upgrade page through so users can pay
  if (isImpersonating || pathname === "/dashboard/subscription") {
    return <>{children}</>;
  }

  const isTrialExpired = subscription !== null && subscription.isTrialExpired;
  const isSubscriptionExpired = subscription !== null && subscription.isSubscriptionExpired;

  if (!isTrialExpired && !isSubscriptionExpired) return <>{children}</>;

  const isSubscription = isSubscriptionExpired && !isTrialExpired;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <LockKeyhole className="size-8 text-muted-foreground" />
      </div>

      <div className="max-w-sm space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {isSubscription ? "Your subscription has expired" : "Your free trial has ended"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isSubscription
            ? "Your subscription period has ended. Renew now to restore full access to your clinic data."
            : "Your 14-day trial has expired. Upgrade to a paid plan to continue using Medora and keep all your clinic data."}
        </p>
      </div>

      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
      >
        {isSubscription ? "Renew subscription" : "View plans & upgrade"}
      </Link>

      <p className="text-xs text-muted-foreground">
        Your data is safe. It will be retained for 30 days after expiry.
      </p>
    </div>
  );
}
