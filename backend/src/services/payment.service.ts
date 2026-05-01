import crypto from "crypto";
import { getEnv } from "@/config/env";
import { getRazorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { sendMail } from "@/lib/mailer";
import { paymentConfirmedPlainText, paymentConfirmedHtml } from "@/lib/email-templates/payment";

const PLAN_AMOUNT_PAISE: Record<string, number> = {
  starter: 299900,
  pro:     799900,
};

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  pro:     "Pro",
};

export async function createRazorpayOrder(clinicId: string, plan: string) {
  const amount = PLAN_AMOUNT_PAISE[plan];
  if (!amount) {
    throw new HttpError(400, `Unknown plan: ${plan}`, "INVALID_PLAN");
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `sub_${clinicId.slice(-8)}_${Date.now()}`,
    notes: { clinicId, plan },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    plan,
    planLabel: PLAN_LABEL[plan],
  };
}

export async function verifyAndActivate(params: {
  clinicId: string;
  plan: string;
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

  const amount = PLAN_AMOUNT_PAISE[params.plan];
  if (!amount) {
    throw new HttpError(400, `Unknown plan: ${params.plan}`, "INVALID_PLAN");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

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
    prisma.paymentRecord.create({
      data: {
        clinicId: params.clinicId,
        amount: Math.round(amount / 100), // store in rupees
        plan: params.plan,
        status: "paid",
        description: `${PLAN_LABEL[params.plan] ?? params.plan} plan — Razorpay ${params.razorpayPaymentId}`,
        periodStart: now,
        periodEnd,
      },
    }),
  ]);

  // Send payment confirmation email (fire-and-forget — never block the API response)
  sendPaymentConfirmationEmail(params.clinicId, {
    plan: PLAN_LABEL[params.plan] ?? params.plan,
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
