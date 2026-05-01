"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Zap, Building2, FlaskConical, Copy } from "lucide-react";
import { toast } from "sonner";
import { useClinicStore } from "@/stores/clinic-store";
import { useDashboardSession } from "@/app/dashboard/_hooks/use-dashboard-session";
import { DashboardPageHeader } from "@/app/dashboard/_components/page-header";
import {
  createOrder,
  verifyPayment,
  getBillingConfig,
  type PlanId,
  type SubscriptionStatus,
  type BillingConfig,
} from "@/services/billing.service";

// Razorpay checkout.js types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = { open: () => void };

const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  highlighted: boolean;
  icon: typeof Zap;
  features: string[];
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2999,
    description: "Perfect for solo practitioners and small clinics",
    highlighted: false,
    icon: Zap,
    features: [
      "Up to 500 patients",
      "1 doctor",
      "Appointments & queue",
      "Prescriptions & invoices",
      "Patient records",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 7999,
    description: "For growing clinics with multiple doctors",
    highlighted: true,
    icon: Building2,
    features: [
      "Unlimited patients",
      "Up to 5 doctors",
      "Everything in Starter",
      "Multi-location support",
      "Revenue analytics",
      "Priority support",
    ],
  },
];

// Test card details Razorpay provides for sandbox mode
const TEST_CARDS = [
  { label: "Card (success)", value: "4111 1111 1111 1111", note: "Any future date, any CVV" },
  { label: "UPI (success)", value: "success@razorpay", note: "Enter in UPI field" },
  { label: "Card (failure)", value: "4000 0000 0000 0002", note: "Any future date, any CVV" },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);

  useEffect(() => {
    getBillingConfig().then((res) => {
      if (res.ok) setBillingConfig(res.data);
    });
  }, []);

  async function handleUpgrade(planId: PlanId) {
    setLoading(planId);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load payment gateway. Please try again.");
        setLoading(null);
        return;
      }

      const orderRes = await createOrder(planId);
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
        description: `${planLabel} Plan — Monthly`,
        prefill: { name: displayName, email: session?.email },
        theme: { color: "#0f172a" },
        handler: async (response) => {
          const verifyRes = await verifyPayment({
            plan: planId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes.ok) {
            setSubscription(verifyRes.data.subscription as SubscriptionStatus);
            toast.success(`Upgraded to ${planLabel}!`, {
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
  const isTestMode = billingConfig?.isTestMode ?? false;

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
            RAZORPAY_KEY_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs dark:bg-amber-950">
            RAZORPAY_KEY_SECRET
          </code>{" "}
          to your backend <code className="font-mono text-xs">.env</code>.
        </div>
      )}

      {/* Active subscription banner */}
      {isActive && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
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

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
        {PLANS.map((plan) => {
          const isCurrentPlan = isActive && currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col gap-5 rounded-xl border p-6 ${
                plan.highlighted ? "border-primary shadow-sm" : "border-border"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <Icon className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>

              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || loading !== null || billingConfig?.configured === false}
                className={`mt-auto flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  isCurrentPlan
                    ? "cursor-default bg-muted text-muted-foreground"
                    : plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    : "border border-border bg-background text-foreground hover:bg-muted disabled:opacity-60"
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isCurrentPlan ? (
                  "Current plan"
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        All prices are in INR and exclusive of applicable taxes. Payments are processed
        securely via Razorpay.{" "}
        <a
          href="mailto:support@medora.app"
          className="underline underline-offset-2"
        >
          Contact us
        </a>{" "}
        for custom enterprise pricing.
      </p>
    </div>
  );
}
