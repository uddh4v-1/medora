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

/** Helper: validate parsed schema and throw if invalid */
const validateSchema = (parsed: any) => {
  if (parsed.success) return parsed.data;
  const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
  throw new HttpError(400, msg, "VALIDATION_ERROR");
};

/** Helper: set auth cookies for user session */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, rememberMe: boolean) => {
  const env = getEnv();
  res.cookie(env.AUTH_COOKIE_NAME, accessToken, authCookieOptions(env, env.JWT_ACCESS_EXPIRES_IN));
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(env, rememberMe));
};

export const postLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = validateSchema(loginBodySchema.safeParse(req.body));
  const env = getEnv();
  const result = await loginWithCredentials(email, password, rememberMe);

  const accessToken = issueAccessToken(
    { id: result.user.id, email: result.user.email, role: result.user.role, clinicId: result.user.clinic?.id },
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
  const rawRefresh = await createRefreshToken(result.user.id, rememberMe);

  setAuthCookies(res, accessToken, rawRefresh, rememberMe);
  res.status(200).json({ user: result.user, signedInAt: result.signedInAt });
};

export const postRegister = async (req: Request, res: Response): Promise<void> => {
  const { clinicName, phone, ownerName, email, password, slug } = validateSchema(registerBodySchema.safeParse(req.body));
  const env = getEnv();
  const result = await registerClinicOwner({ clinicName, phone, ownerName, email, password, slug });

  const accessToken = issueAccessToken(
    { id: result.user.id, email: result.user.email, role: result.user.role, clinicId: result.user.clinic?.id },
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );
  const rawRefresh = await createRefreshToken(result.user.id, false);

  setAuthCookies(res, accessToken, rawRefresh, false);

  // Fire-and-forget — email failure must not block registration
  requestEmailVerification(result.user.id).catch((err) =>
    console.error("[register] verification email failed:", err),
  );

  res.status(201).json({ user: result.user, signedInAt: result.signedInAt });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await findUserById(req.auth!.userId);
  if (!user) throw new HttpError(401, "User not found", "USER_NOT_FOUND");
  
  const responseUser = req.auth!.isImpersonation
    ? { ...user, isImpersonating: true, impersonatedBy: req.auth!.impersonatedBy }
    : user;
  
  res.status(200).json({ user: responseUser });
};

export const postRefreshToken = async (req: Request, res: Response): Promise<void> => {
  const env = getEnv();
  const rawToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
  
  if (!rawToken || typeof rawToken !== "string") {
    throw new HttpError(401, "No refresh token provided", "UNAUTHORIZED");
  }

  const { accessToken, rawRefreshToken, rememberMe, user } = await rotateRefreshToken(rawToken);
  
  setAuthCookies(res, accessToken, rawRefreshToken, rememberMe);
  res.status(200).json({ user });
};

/** Clears both cookies and revokes the DB refresh token. */
export const postLogout = async (req: Request, res: Response): Promise<void> => {
  const env = getEnv();
  const rawRefresh = req.cookies?.[env.REFRESH_COOKIE_NAME];
  
  if (typeof rawRefresh === "string" && rawRefresh.length > 0) {
    revokeRefreshToken(rawRefresh).catch((err) =>
      console.error("[logout] token revocation failed:", err),
    );
  }

  const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" as const };
  
  res.clearCookie(env.AUTH_COOKIE_NAME, { ...cookieOptions, path: "/" });
  res.clearCookie(env.REFRESH_COOKIE_NAME, { ...cookieOptions, path: "/api/auth/refresh" });
  res.status(204).end();
};

/** Always returns 200 with a generic message (no email enumeration). */
export const postForgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = validateSchema(forgotPasswordBodySchema.safeParse(req.body));
  await requestPasswordReset(email);
  res.status(200).json({
    message: "If an account exists for this email, we sent password reset instructions.",
  });
};

export const postResetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = validateSchema(resetPasswordBodySchema.safeParse(req.body));
  await resetPasswordWithToken(token, newPassword);
  res.status(200).json({ message: "Password updated. You can sign in with your new password." });
};

export const postChangePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = validateSchema(changePasswordBodySchema.safeParse(req.body));
  await changePassword(req.auth!.userId, currentPassword, newPassword);
  res.status(200).json({ message: "Password changed successfully." });
};

/** Resend verification email — requires auth so we know which user to send to. */
export const postSendVerification = async (req: Request, res: Response): Promise<void> => {
  await requestEmailVerification(req.auth!.userId);
  res.status(200).json({ message: "Verification email sent. Please check your inbox." });
};

export const postVerifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = validateSchema(verifyEmailBodySchema.safeParse(req.body));
  await verifyEmailWithToken(token);
  res.status(200).json({ message: "Email verified successfully." });
};
