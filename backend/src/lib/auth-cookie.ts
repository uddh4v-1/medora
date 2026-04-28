import type { CookieOptions } from "express";
import ms from "ms";

import type { Env } from "@/config/env";

/** Cookie maxAge (ms) aligned with JWT `JWT_EXPIRES_IN`. */
export function jwtExpiryMs(env: Env): number {
  const parsed = ms(env.JWT_EXPIRES_IN as Parameters<typeof ms>[0]);
  return typeof parsed === "number" ? parsed : (ms("7d") as number);
}

export function authCookieOptions(env: Env): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: jwtExpiryMs(env),
  };
}
