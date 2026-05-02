"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, FlaskConical, Copy } from "lucide-react";
import { toast } from "sonner";
import { useClinicStore } from "@/stores/clinic-store";
import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { DashboardPageHeader } from "@/app/dashboard/_components/page-header";
import {
  createOrder,
  verifyPayment,
  getBillingConfig,
  getPublicPlans,
  type PlanId,
  type SubscriptionStatus,
  type BillingConfig,
} from "@/services/billing.service";
import type { CustomPlan } from "@/services/types/superadmin.types";
import { cn } from "@/lib/utils";
import { loadRazorpayScript } from "@/lib/razorpay";
import { plans as staticPlans } from "@/lib/site-content";

// Derive fallback plans from the same static source the landing page uses so
// prices are always consistent between the two pages.
function parsePaisa(formatted: string): number {
  return Math.round(parseFloat(formatted.replace(/[₹,]/g, "")) * 100);
}

const FALLBACK_PLANS: CustomPlan[] = staticPlans.map((p, i) => ({
  id: p.planId ?? `plan-${i}`,
  name: p.name,
  price: parsePaisa(p.price),
  annualPrice: p.annualPrice ? parsePaisa(p.annualPrice) : null,
  planId: p.planId,
  description: null,
  displayFeatures: p.features,
  features: {},
  highlighted: p.highlighted,
  ctaText: p.cta,
  sortOrder: i,
  isActive: true,
  maxPatients: null,
  maxUsers: null,
  createdAt: "",
  updatedAt: "",
}));

const TEST_CARDS = [
  { label: "Card (success)", value: "4111 1111 1111 1111", note: "Any future date, any CVV" },
  { label: "UPI (success)", value: "success@razorpay", note: "Enter in UPI field" },
  { label: "Card (failure)", value: "4000 0000 0000 0002", note: "Any future date, any CVV" },
];

function fmtPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}


function copyText(text: string) {
  navigator.clipboard?.writeText(text).then(() => toast.success("Copied!"));
}

function TestModePanel() {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
        <FlaskConical className="size-4" />
        Test mode — no real money is charged
      </div>
      <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
        Razorpay is in test mode. Use the credentials below in the checkout popup.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {TEST_CARDS.map((c) => (
          <div
            key={c.value}
            className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-xs dark:bg-violet-950/50"
          >
            <div>
              <span className="font-medium text-foreground">{c.label}</span>
              <span className="ml-2 font-mono text-muted-foreground">{c.value}</span>
              <span className="ml-2 text-muted-foreground">— {c.note}</span>
            </div>
            <button
              onClick={() => copyText(c.value.replace(/\s/g, ""))}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Copy"
            >
              <Copy className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { displayName, session } = useDashboardSession();
  const subscription = useClinicStore((s) => s.subscription);
  const setSubscription = useClinicStore((s) => s.setSubscription);
  const [loading, setLoading] = useState<string | null>(null);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);
  const [plans, setPlans] = useState<CustomPlan[]>(FALLBACK_PLANS);
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    getBillingConfig().then((res) => {
      if (res.ok) setBillingConfig(res.data);
    });
    getPublicPlans().then((res) => {
      setPlans(Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_PLANS);
    });
  }, []);

  async function handleUpgrade(planId: PlanId, planName: string, isAnnual: boolean) {
    setLoading(planId);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway. Please try again.");
        setLoading(null);
        return;
      }

      const orderRes = await createOrder(planId, isAnnual);
      if (!orderRes.ok) {
        toast.error("Failed to create payment order. Please try again.");
        setLoading(null);
        return;
      }

      const { orderId, amount, currency, keyId, planLabel } = orderRes.data;

      const callbackUrl = `${window.location.origin}/dashboard/subscription/payment-callback?plan=${planId}${isAnnual ? "&annual=true" : ""}`;

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: "Medora",
        description: `${planLabel} Plan — ${isAnnual ? "Annual" : "Monthly"}`,
        prefill: { name: displayName, email: session?.email },
        theme: { color: "#0f172a" },
        callback_url: callbackUrl,
        handler: async (response) => {
          const verifyRes = await verifyPayment({
            plan: planId,
            annual: isAnnual,
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

  const currentPlan = subscription?.plan ?? "trial";
  const isActive = subscription?.billingStatus === "active";
  const isOnTrial = subscription?.billingStatus === "trial";
  const isTestMode = billingConfig?.isTestMode ?? false;
  const hasAnnual = plans.some((p) => p.annualPrice != null);
  const annualDiscountPct = plans.reduce((max, p) => {
    if (p.annualPrice == null || p.price === 0) return max;
    return Math.max(max, Math.round((1 - p.annualPrice / p.price) * 100));
  }, 0);

  return (
    <div className="flex flex-col gap-6 px-6 py-6 md:px-8">
      <DashboardPageHeader eyebrow="Account" title="Subscription" />

      {/* Test mode notice */}
      {isTestMode && <TestModePanel />}

      {/* Not configured */}
      {billingConfig && !billingConfig.configured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Razorpay keys are not configured. Add{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-950">
            Test_Key_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-950">
            Test_Key_Secret
          </code>{" "}
          to your backend <code className="font-mono text-xs">.env</code>.
        </div>
      )}

      {/* Active subscription banner */}
      {isActive && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
          <Check className="size-5 text-green-600 dark:text-green-400" />
          <div className="text-sm">
            <span className="font-medium text-green-800 dark:text-green-200">
              Active subscription
            </span>
            {subscription?.currentPeriodEnd && (
              <span className="ml-1 text-green-700 dark:text-green-300">
                — renews on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Trial countdown */}
      {subscription?.billingStatus === "trial" && !subscription.isTrialExpired && (
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          You have{" "}
          <strong className="text-foreground">
            {subscription.daysRemaining} day
            {subscription.daysRemaining === 1 ? "" : "s"}
          </strong>{" "}
          remaining in your free trial.
        </div>
      )}

      {/* Annual / Monthly toggle */}
      {hasAnnual && (
        <div className="flex items-center gap-3">
          <span className={cn("text-sm", !annual ? "font-medium text-foreground" : "text-muted-foreground")}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((a) => !a)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              annual ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                annual ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "font-medium text-foreground" : "text-muted-foreground")}>
            Annual
            {annualDiscountPct > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Save {annualDiscountPct}%
              </span>
            )}
          </span>
        </div>
      )}

      {/* Plan cards — same grid as landing page */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:max-w-5xl">
        {plans.map((plan) => {
          const isCurrentPlan = isActive && currentPlan === plan.planId;
          const displayPrice = annual && plan.annualPrice != null
            ? fmtPrice(plan.annualPrice)
            : fmtPrice(plan.price);
          const ctaText = plan.ctaText ?? plan.name;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl p-2 transition-all",
                plan.highlighted
                  ? "ring-2 ring-primary shadow-sm"
                  : "ring-1 ring-border hover:ring-foreground/20"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}

              <div className="px-5 pt-5 pb-1">
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">{displayPrice}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                {plan.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-4">
                <ul className="flex flex-col gap-2.5">
                  {plan.displayFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-2">
                  {plan.planId && (plan.planId === "starter" || plan.planId === "pro") ? (
                    <button
                      onClick={() => handleUpgrade(plan.planId as PlanId, plan.name, annual)}
                      disabled={isCurrentPlan || loading !== null || !billingConfig || billingConfig.configured === false}
                      className={cn(
                        "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60",
                        isCurrentPlan
                          ? "cursor-default bg-muted text-muted-foreground"
                          : plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-border bg-card text-foreground hover:bg-accent"
                      )}
                    >
                      {loading === plan.planId ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        "Current plan"
                      ) : isOnTrial ? (
                        "Buy now"
                      ) : (
                        ctaText
                      )}
                    </button>
                  ) : (
                    <a
                      href="mailto:hello@medora.app?subject=Enterprise%20pricing"
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition",
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-border bg-card text-foreground hover:bg-accent"
                      )}
                    >
                      {ctaText}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        All prices are in INR and exclusive of applicable taxes. Payments are processed
        securely via Razorpay.{" "}
        <a
          href="mailto:hello@medora.app"
          className="underline underline-offset-2"
        >
          Contact us
        </a>{" "}
        for custom enterprise pricing.
      </p>
    </div>
  );
}
