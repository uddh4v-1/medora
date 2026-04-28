import type { Request, Response } from "express";

import { getEnv } from "@/config/env";
import { authCookieOptions } from "@/lib/auth-cookie";
import {
  loginBodySchema,
  registerBodySchema,
} from "@/schemas/auth.schemas";
import {
  findUserById,
  loginWithCredentials,
  registerWithCredentials,
} from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";

export async function postLogin(req: Request, res: Response): Promise<void> {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const { email, password } = parsed.data;
  const env = getEnv();
  const result = await loginWithCredentials(email, password);

  res.cookie(env.AUTH_COOKIE_NAME, result.token, authCookieOptions(env));

  /** Token is in httpOnly cookie — not returned in JSON (XSS-safe). */
  res.status(200).json({
    user: result.user,
    signedInAt: result.signedInAt,
  });
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  const parsed = registerBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", "VALIDATION_ERROR");
  }

  const { email, password } = parsed.data;
  const env = getEnv();
  const result = await registerWithCredentials(email, password);

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
