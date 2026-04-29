import type { Request, Response } from "express";

import { getEnv } from "@/config/env";
import { authCookieOptions } from "@/lib/auth-cookie";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from "@/schemas/auth.schemas";
import {
  findUserById,
  loginWithCredentials,
  registerClinicOwner,
} from "@/services/auth.service";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/services/password-reset.service";
import { HttpError } from "@/utils/http-error";

export async function postLogin(req: Request, res: Response): Promise<void> {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const { email, password, rememberMe } = parsed.data;
  const env = getEnv();
  const result = await loginWithCredentials(email, password, rememberMe);

  const jwtTtl = rememberMe
    ? env.JWT_REMEMBER_ME_EXPIRES_IN
    : env.JWT_SESSION_EXPIRES_IN;

  res.cookie(env.AUTH_COOKIE_NAME, result.token, authCookieOptions(env, jwtTtl));

  /** Token is in httpOnly cookie — not returned in JSON (XSS-safe). */
  res.status(200).json({
    user: result.user,
    signedInAt: result.signedInAt,
  });
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const { clinicName, phone, ownerName, email, password, slug } = parsed.data;
  const env = getEnv();
  const result = await registerClinicOwner({
    clinicName,
    phone,
    ownerName,
    email,
    password,
    slug,
  });

  res.cookie(env.AUTH_COOKIE_NAME, result.token, authCookieOptions(env));

  res.status(201).json({
    user: result.user,
    signedInAt: result.signedInAt,
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  }

  const user = await findUserById(req.auth.userId);
  if (!user) {
    throw new HttpError(401, "User not found", "USER_NOT_FOUND");
  }

  res.status(200).json({ user });
}

/** Clears session cookie — no auth needed (expires client cookie even when JWT is stale). */
export async function postLogout(_req: Request, res: Response): Promise<void> {
  const env = getEnv();
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(204).end();
}

/**
 * Always returns 200 with a generic message (no email enumeration).
 */
export async function postForgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await requestPasswordReset(parsed.data.email);

  res.status(200).json({
    message:
      "If an account exists for this email, we sent password reset instructions.",
  });
}

export async function postResetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);

  res.status(200).json({
    message: "Password updated. You can sign in with your new password.",
  });
}
