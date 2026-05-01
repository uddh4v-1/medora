"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { PricingCardProps } from "./pricing-card";
import { PricingCard } from "./pricing-card";
import { SectionHeading } from "./section-heading";
import {
  getSubscription,
  getBillingConfig,
  createOrder,
  verifyPayment,
  type PlanId,
  type SubscriptionStatus,
  type BillingConfig,
} from "@/services/billing.service";
import { getMe } from "@/services/auth.service";
import { loadRazorpayScript } from "@/lib/razorpay";

export type PricingPlan = Omit<PricingCardProps, "annual" | "onCta" | "loading" | "disabled">;

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const hasAnnual = plans.some((p) => p.annualPrice != null);

  const [loading, setLoading] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getMe();
        if (res.ok && res.data.user?.clinic) {
          setIsAuthenticated(true);
          setDisplayName(res.data.user.name ?? "");
          setEmail(res.data.user.email);
          const [subRes, configRes] = await Promise.all([
            getSubscription(),
            getBillingConfig(),
          ]);
          if (subRes.ok) setSubscription(subRes.data.subscription);
          if (configRes.ok) setBillingConfig(configRes.data);
        }
      } catch {
        // Unauthenticated visitors — proceed without auth context
      }
    }
    checkAuth();
  }, []);

  async function handleCta(planId: string | null, planName: string) {
    if (!planId) {
      window.location.href = "mailto:hello@medora.app?subject=Enterprise%20pricing";
      return;
    }

    if (!isAuthenticated) {
      router.push("/register");
      return;
    }

    if (!billingConfig || billingConfig.configured === false) {
      toast.error("Payment gateway not configured. Please contact support.");
      return;
    }

    setLoading(planId);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway. Please try again.");
        setLoading(null);
        return;
      }

      const orderRes = await createOrder(planId as PlanId);
      if (!orderRes.ok) {
        toast.error("Failed to create payment order. Please try again.");
        setLoading(null);
        return;
      }

      const { orderId, amount, currency, keyId, planLabel } = orderRes.data;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Medora",
        description: `${planLabel} Plan`,
        prefill: { name: displayName, email },
        theme: { color: "#0f172a" },
        handler: async (response) => {
          const verifyRes = await verifyPayment({
            plan: planId as PlanId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (verifyRes.ok) {
            setSubscription(verifyRes.data.subscription as SubscriptionStatus);
            toast.success(`Upgraded to ${planName}!`, {
              description: "Your subscription is now active.",
            });
          } else {
            toast.error("Payment received but verification failed. Contact support.");
          }
          setLoading(null);
        },
        modal: { ondismiss: () => setLoading(null) },
      });

      rzp.open();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(null);
    }
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
            <span className="ml-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Save 20%
            </span>
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
              disabled={isCurrentPlan || loading !== null}
              loading={loading === plan.planId}
              onCta={() => handleCta(plan.planId, plan.name)}
            />
          );
        })}
      </div>
    </section>
  );
}
