"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { PricingCardProps } from "./pricing-card";
import { PricingCard } from "./pricing-card";
import { SectionHeading } from "./section-heading";
import {
  getSubscription,
  type SubscriptionStatus,
} from "@/services/billing.service";
import { getMe } from "@/services/auth.service";

export type PricingPlan = Omit<PricingCardProps, "annual" | "onCta" | "loading" | "disabled">;

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const hasAnnual = plans.some((p) => p.annualPrice != null);
  const maxDiscountPct = plans.reduce(
    (max, p) => Math.max(max, p.discountPct ?? 0),
    0,
  );

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getMe();
        if (res.ok && res.data.user?.clinic) {
          setIsAuthenticated(true);
          const subRes = await getSubscription();
          if (subRes.ok) setSubscription(subRes.data.subscription);
        }
      } catch {
        // Unauthenticated visitors — proceed without auth context
      }
    }
    checkAuth();
  }, []);

  function handleCta(planId: string | null) {
    if (!planId) {
      window.location.href = "mailto:hello@medora.app?subject=Enterprise%20pricing";
      return;
    }
    // Landing page CTAs drive signups; upgrade happens inside the dashboard
    router.push(isAuthenticated ? "/dashboard/subscription" : "/signup");
  }

  const isActive = subscription?.billingStatus === "active";
  const currentPlan = subscription?.plan ?? null;

  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans. Cancel anytime."
        description="14-day free trial, no card needed."
        align="center"
      />

      {hasAnnual && (
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((a) => !a)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${annual ? "bg-brand" : "bg-muted"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-sm ${annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Annual
            {maxDiscountPct > 0 && (
              <span className="ml-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                Save {maxDiscountPct}%
              </span>
            )}
          </span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = isActive && currentPlan === plan.planId;
          return (
            <PricingCard
              key={plan.name}
              {...plan}
              annual={annual}
              cta={isCurrentPlan ? "Current plan" : plan.cta}
              disabled={isCurrentPlan}
              loading={false}
              onCta={() => handleCta(plan.planId)}
            />
          );
        })}
      </div>
    </section>
  );
}
