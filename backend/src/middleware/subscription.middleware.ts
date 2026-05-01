import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/utils/http-error";
import { getClinicSubscription } from "@/services/clinic.service";

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
    const sub = await getClinicSubscription(auth.clinicId);

    if (sub.billingStatus === "active") {
      next();
      return;
    }

    if (sub.billingStatus === "trial" && !sub.isTrialExpired) {
      next();
      return;
    }

    if (sub.billingStatus === "trial") {
      next(new HttpError(402, "Your free trial has ended. Please upgrade to continue.", "TRIAL_EXPIRED"));
      return;
    }

    // cancelled, unpaid, or any other status
    next(new HttpError(402, "Your subscription is inactive. Please renew to continue.", "SUBSCRIPTION_INACTIVE"));
  } catch (e) {
    next(e);
  }
}
