import type { Request, Response } from "express";

import { getEnv } from "@/config/env";
import { authCookieOptions, refreshCookieOptions } from "@/lib/auth-cookie";
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from "@/schemas/auth.schemas";
import {
  changePassword,
  createRefreshToken,
  findUserById,
  issueAccessToken,
  loginWithCredentials,
  registerClinicOwner,
  revokeRefreshToken,
  rotateRefreshToken,
} from "@/services/auth.service";
import {
  requestEmailVerification,
  verifyEmailWithToken,
} from "@/services/email-verification.service";
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

  const accessToken = issueAccessToken(
    { id: result.user.id, email: result.user.email, role: result.user.role, clinicId: result.user.clinic?.id },
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
  const rawRefresh = await createRefreshToken(result.user.id, rememberMe);

  res.cookie(env.AUTH_COOKIE_NAME, accessToken, authCookieOptions(env, env.JWT_ACCESS_EXPIRES_IN));
  res.cookie(env.REFRESH_COOKIE_NAME, rawRefresh, refreshCookieOptions(env, rememberMe));

  res.status(200).json({ user: result.user, signedInAt: result.signedInAt });
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const { clinicName, phone, ownerName, email, password, slug } = parsed.data;
  const env = getEnv();
  const result = await registerClinicOwner({ clinicName, phone, ownerName, email, password, slug });

  const accessToken = issueAccessToken(
    { id: result.user.id, email: result.user.email, role: result.user.role, clinicId: result.user.clinic?.id },
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
  const rawRefresh = await createRefreshToken(result.user.id, false);

  res.cookie(env.AUTH_COOKIE_NAME, accessToken, authCookieOptions(env, env.JWT_ACCESS_EXPIRES_IN));
  res.cookie(env.REFRESH_COOKIE_NAME, rawRefresh, refreshCookieOptions(env, false));

  // Fire-and-forget — email failure must not block registration
  requestEmailVerification(result.user.id).catch((err) =>
    console.error("[register] verification email failed:", err),
  );

  res.status(201).json({ user: result.user, signedInAt: result.signedInAt });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await findUserById(req.auth!.userId);
  if (!user) throw new HttpError(401, "User not found", "USER_NOT_FOUND");
  res.status(200).json({ user });
}

export async function postRefreshToken(req: Request, res: Response): Promise<void> {
  const env = getEnv();
  const rawToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (!rawToken || typeof rawToken !== "string") {
    throw new HttpError(401, "No refresh token provided", "UNAUTHORIZED");
  }

  const { accessToken, rawRefreshToken, rememberMe, user } = await rotateRefreshToken(rawToken);

  res.cookie(env.AUTH_COOKIE_NAME, accessToken, authCookieOptions(env, env.JWT_ACCESS_EXPIRES_IN));
  res.cookie(env.REFRESH_COOKIE_NAME, rawRefreshToken, refreshCookieOptions(env, rememberMe));

  res.status(200).json({ user });
}

/** Clears both cookies and revokes the DB refresh token. */
export async function postLogout(req: Request, res: Response): Promise<void> {
  const env = getEnv();

  const rawRefresh = req.cookies?.[env.REFRESH_COOKIE_NAME];
  if (typeof rawRefresh === "string" && rawRefresh.length > 0) {
    revokeRefreshToken(rawRefresh).catch((err) =>
      console.error("[logout] token revocation failed:", err),
    );
  }

  res.clearCookie(env.AUTH_COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.clearCookie(env.REFRESH_COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/refresh" });
  res.status(204).end();
}

/** Always returns 200 with a generic message (no email enumeration). */
export async function postForgotPassword(req: Request, res: Response): Promise<void> {
  const parsed = forgotPasswordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await requestPasswordReset(parsed.data.email);

  res.status(200).json({
    message: "If an account exists for this email, we sent password reset instructions.",
  });
}

export async function postResetPassword(req: Request, res: Response): Promise<void> {
  const parsed = resetPasswordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);

  res.status(200).json({ message: "Password updated. You can sign in with your new password." });
}

export async function postChangePassword(req: Request, res: Response): Promise<void> {
  const parsed = changePasswordBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await changePassword(req.auth!.userId, parsed.data.currentPassword, parsed.data.newPassword);

  res.status(200).json({ message: "Password changed successfully." });
}

/** Resend verification email — requires auth so we know which user to send to. */
export async function postSendVerification(req: Request, res: Response): Promise<void> {
  await requestEmailVerification(req.auth!.userId);
  res.status(200).json({ message: "Verification email sent. Please check your inbox." });
}

export async function postVerifyEmail(req: Request, res: Response): Promise<void> {
  const parsed = verifyEmailBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await verifyEmailWithToken(parsed.data.token);

  res.status(200).json({ message: "Email verified successfully." });
}
