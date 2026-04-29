import type { CookieOptions } from "express";
import ms from "ms";

import type { Env } from "@/config/env";

/** Cookie maxAge (ms) aligned with JWT expiry string (e.g. `1d`, `30d`). */
export function jwtExpiryMsFromExpiresIn(expiresIn: string): number {
  const parsed = ms(expiresIn as Parameters<typeof ms>[0]);
  return typeof parsed === "number"
    ? parsed
    : (ms("7d") as number);
}

export function authCookieOptions(env: Env, jwtExpiresIn?: string): CookieOptions {
  const ttl = jwtExpiresIn ?? env.JWT_EXPIRES_IN;
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: jwtExpiryMsFromExpiresIn(ttl),
  };
}
