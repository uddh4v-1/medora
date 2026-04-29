import rateLimit from "express-rate-limit";

const RATE_LIMITED = { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" };

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes.", code: "RATE_LIMITED" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many registration attempts. Try again in 1 hour.", code: "RATE_LIMITED" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset requests. Try again in 1 hour.", code: "RATE_LIMITED" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { ...RATE_LIMITED, error: "Too many verification emails requested. Try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { ...RATE_LIMITED },
  standardHeaders: true,
  legacyHeaders: false,
});
