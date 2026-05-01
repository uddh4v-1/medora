import type { NextFunction, Request, Response } from "express";

import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";

/**
 * Blocks clinic users whose trial has expired or billing is inactive.
 * Must be placed after `requireAuth`.
 * SuperAdmin sessions and impersonation sessions are always allowed through.
 */
export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = req.auth;

  if (!auth) {
    next(new HttpError(401, "Not authenticated", "UNAUTHORIZED"));
    return;
  }

  // SuperAdmin and impersonation sessions bypass subscription checks
  if (auth.role === "SuperAdmin" || auth.isImpersonation) {
    next();
    return;
  }

  // Users not yet attached to a clinic (shouldn't happen in normal flow)
  if (!auth.clinicId) {
    next();
    return;
  }

  try {
    const sub = await prisma.clinicSubscription.findUnique({
      where: { clinicId: auth.clinicId },
      select: { billingStatus: true, trialEndsAt: true },
    });

    // No subscription row — treat as expired (defensive; all new clinics get one on register)
    if (!sub) {
      next(new HttpError(402, "No active subscription found. Please contact support.", "NO_SUBSCRIPTION"));
      return;
    }

    if (sub.billingStatus === "active") {
      next();
      return;
    }

    if (sub.billingStatus === "trial") {
      if (sub.trialEndsAt && sub.trialEndsAt > new Date()) {
        next();
        return;
      }
      next(new HttpError(402, "Your free trial has ended. Please upgrade to continue.", "TRIAL_EXPIRED"));
      return;
    }

    // cancelled, unpaid, or any other status
    next(new HttpError(402, "Your subscription is inactive. Please renew to continue.", "SUBSCRIPTION_INACTIVE"));
  } catch (e) {
    next(e);
  }
}
