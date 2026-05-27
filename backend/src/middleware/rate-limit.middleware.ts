import rateLimit from "express-rate-limit";

const RATE_LIMITED = { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" };

export const commonLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: RATE_LIMITED,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes.", code: "RATE_LIMITED" },
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
