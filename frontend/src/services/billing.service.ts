import { apiGet, apiPost } from "./api";
import type { CustomPlan } from "./types/superadmin.types";

export type SubscriptionStatus = {
  plan: string;
  billingStatus: "trial" | "active" | "unpaid" | "cancelled";
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isTrialExpired: boolean;
  isSubscriptionExpired: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

export type PlanId = "starter" | "pro";

export type RazorpayOrder = {
  orderId: string;
  amount: number;
  currency: string;
  plan: string;
  planLabel: string;
  keyId: string;
};

export type BillingConfig = {
  keyId: string | null;
  isTestMode: boolean;
  configured: boolean;
};

export async function getPublicPlans() {
  return apiGet<CustomPlan[]>("/api/plans");
}

export async function getSubscription() {
  return apiGet<{ subscription: SubscriptionStatus }>("/api/billing/subscription");
}

export async function getBillingConfig() {
  return apiGet<BillingConfig>("/api/billing/config");
}

export async function createOrder(plan: PlanId, annual?: boolean) {
  return apiPost<RazorpayOrder, { plan: PlanId; annual?: boolean }>("/api/billing/orders", {
    plan,
    ...(annual !== undefined && { annual }),
  });
}

export async function verifyPayment(params: {
  plan: PlanId;
  annual?: boolean;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiPost<{ subscription: SubscriptionStatus }, typeof params>(
    "/api/billing/verify",
    params,
  );
}
