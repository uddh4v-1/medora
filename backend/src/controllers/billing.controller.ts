import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "@/utils/http-error";
import { getClinicSubscription } from "@/services/clinic.service";
import { createRazorpayOrder, verifyAndActivate } from "@/services/payment.service";
import { getEnv } from "@/config/env";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function getSubscriptionHandler(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const subscription = await getClinicSubscription(clinicId);
  res.json({ subscription });
}

export function getBillingConfigHandler(_req: Request, res: Response): void {
  const env = getEnv();
  const keyId = env.Test_Key_ID ?? null;
  res.json({
    keyId,
    isTestMode: keyId?.startsWith("rzp_test_") ?? false,
    configured: keyId !== null,
  });
}

const CreateOrderBody = z.object({
  plan: z.enum(["starter", "pro"]),
});

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const order = await createRazorpayOrder(clinicId, parsed.data.plan);
  const env = getEnv();
  res.status(201).json({ ...order, keyId: env.Test_Key_ID });
}

const VerifyBody = z.object({
  plan:                z.enum(["starter", "pro"]),
  razorpayOrderId:     z.string().min(1),
  razorpayPaymentId:   z.string().min(1),
  razorpaySignature:   z.string().min(1),
});

export async function verifyPaymentHandler(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = VerifyBody.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const subscription = await verifyAndActivate({ clinicId, ...parsed.data });
  res.json({ subscription });
}
