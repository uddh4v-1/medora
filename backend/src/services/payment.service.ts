import crypto from "crypto";
import { getEnv } from "@/config/env";
import { getRazorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { sendMail } from "@/lib/mailer";
import { paymentConfirmedPlainText, paymentConfirmedHtml } from "@/lib/email-templates/payment";

// Fallback amounts (paise) used when no matching CustomPlan row exists in DB
const FALLBACK_AMOUNT_PAISE: Record<string, number> = {
  starter: 99900,
  pro:     199900,
};

const FALLBACK_ANNUAL_AMOUNT_PAISE: Record<string, number> = {
  starter: 79900 * 12,  // 958800
  pro:     159900 * 12, // 1918800
};

const FALLBACK_LABEL: Record<string, string> = {
  starter: "Solo",
  pro:     "Clinic",
};

export async function createRazorpayOrder(clinicId: string, plan: string, annual = false) {
  // Prefer the price from the active CustomPlan row so the landing page and
  // checkout always show the same number. Fall back to hardcoded defaults if
  // no matching plan has been configured in the SuperAdmin panel.
  const dbPlan = await prisma.customPlan.findFirst({
    where: { planId: plan, isActive: true },
    select: { price: true, annualPrice: true, name: true },
  });

  const amount = annual
    ? (dbPlan?.annualPrice != null ? dbPlan.annualPrice * 12 : FALLBACK_ANNUAL_AMOUNT_PAISE[plan])
    : (dbPlan?.price ?? FALLBACK_AMOUNT_PAISE[plan]);
  const planLabel = dbPlan?.name ?? FALLBACK_LABEL[plan];

  if (!amount) {
    throw new HttpError(400, `Unknown plan: ${plan}`, "INVALID_PLAN");
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `sub_${clinicId.slice(-8)}_${Date.now()}`,
    notes: { clinicId, plan, annual: String(annual) },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    plan,
    planLabel,
  };
}

export async function verifyAndActivate(params: {
  clinicId: string;
  plan: string;
  annual?: boolean;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const env = getEnv();
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, "Payment gateway is not configured", "PAYMENT_NOT_CONFIGURED");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== params.razorpaySignature) {
    throw new HttpError(400, "Payment verification failed. Please contact support.", "INVALID_SIGNATURE");
  }

  const dbPlan = await prisma.customPlan.findFirst({
    where: { planId: params.plan, isActive: true },
    select: { price: true, annualPrice: true, name: true, features: true },
  });

  const annual = params.annual ?? false;
  const amount = annual
    ? (dbPlan?.annualPrice != null ? dbPlan.annualPrice * 12 : FALLBACK_ANNUAL_AMOUNT_PAISE[params.plan])
    : (dbPlan?.price ?? FALLBACK_AMOUNT_PAISE[params.plan]);
  const planLabel = dbPlan?.name ?? FALLBACK_LABEL[params.plan];

  if (!amount) {
    throw new HttpError(400, `Unknown plan: ${params.plan}`, "INVALID_PLAN");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + (annual ? 365 : 30));

  // Check if the plan grants multi-clinic access
  const planFeatures = (dbPlan?.features ?? {}) as Record<string, unknown>;
  const grantsMultiClinic = planFeatures.multiClinic === true;

  const [subscription] = await prisma.$transaction([
    prisma.clinicSubscription.upsert({
      where: { clinicId: params.clinicId },
      create: {
        clinicId: params.clinicId,
        plan: params.plan,
        billingStatus: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: params.plan,
        billingStatus: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    }),
    prisma.clinicFeatureFlags.upsert({
      where: { clinicId: params.clinicId },
      create: { clinicId: params.clinicId, multiClinic: grantsMultiClinic },
      update: { multiClinic: grantsMultiClinic },
    }),
    prisma.paymentRecord.create({
      data: {
        clinicId: params.clinicId,
        amount: Math.round(amount / 100),
        plan: params.plan,
        status: "paid",
        description: `${planLabel} plan — ${annual ? "Annual" : "Monthly"} — Razorpay ${params.razorpayPaymentId}`,
        periodStart: now,
        periodEnd,
      },
    }),
  ]);

  // Send payment confirmation email (fire-and-forget — never block the API response)
  sendPaymentConfirmationEmail(params.clinicId, {
    plan: planLabel,
    amountRupees: Math.round(amount / 100),
    periodEnd,
  }).catch((e) => console.error("[payment] confirmation email failed:", e));

  return {
    plan: subscription.plan,
    billingStatus: subscription.billingStatus,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    daysRemaining: null,
    isTrialExpired: false,
  };
}

async function sendPaymentConfirmationEmail(
  clinicId: string,
  opts: { plan: string; amountRupees: number; periodEnd: Date },
): Promise<void> {
  const env = getEnv();
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      name: true,
      users: {
        where: { role: "Owner" },
        select: { email: true, name: true },
        take: 1,
      },
    },
  });

  const owner = clinic?.users[0];
  if (!owner) return;

  await sendMail({
    to: owner.email,
    subject: `Payment confirmed — ${opts.plan} plan activated`,
    text: paymentConfirmedPlainText({
      clinicName: clinic!.name,
      ownerName: owner.name || owner.email,
      plan: opts.plan,
      amountRupees: opts.amountRupees,
      periodEnd: opts.periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      dashboardUrl: `${env.APP_ORIGIN}/dashboard`,
    }),
    html: paymentConfirmedHtml({
      clinicName: clinic!.name,
      ownerName: owner.name || owner.email,
      plan: opts.plan,
      amountRupees: opts.amountRupees,
      periodEnd: opts.periodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      dashboardUrl: `${env.APP_ORIGIN}/dashboard`,
    }),
  });
}
