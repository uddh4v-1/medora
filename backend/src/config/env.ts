import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().positive().default(4100),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Neon connection string)"),
  CORS_ORIGINS: z.string().optional(),
  /** HS256 signing secret — use a long random string in production */
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters"),
  /** Default JWT lifetime (e.g. register; fallbacks in auth-cookie) */
  JWT_EXPIRES_IN: z.string().default("7d"),
  /** Login when “Remember me” is off — shorter session */
  JWT_SESSION_EXPIRES_IN: z.string().default("1d"),
  /** Login when “Remember me” is on */
  JWT_REMEMBER_ME_EXPIRES_IN: z.string().default("30d"),
  /** HttpOnly cookie name storing the access JWT (`server-side session`) */
  AUTH_COOKIE_NAME: z.string().default("medora_session"),

  /** Public web app URL (used in password-reset emails: `${APP_ORIGIN}/reset-password?token=`) */
  APP_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3000"),
  /** Forgot-password link TTL */
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().positive().max(1440).default(60),

  /** `true`: use Gmail (`service: gmail` in nodemailer). Requires SMTP_USER (= Google account), SMTP_PASSWORD (= [App Password](https://support.google.com/accounts/answer/185833)), MAIL_FROM. SMTP_HOST is ignored when set. */
  USE_GMAIL_SMTP: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined) return false;
      const s = v.trim().toLowerCase();
      return s === "true" || s === "1" || s === "yes" || s === "on";
    }),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().positive().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  /** Required if SMTP_HOST is set — e.g. `Medora <no-reply@yourdomain.com>` */
  MAIL_FROM: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.superRefine((data, ctx) => {
    const gmail = data.USE_GMAIL_SMTP === true;
    const hasHost = Boolean(data.SMTP_HOST?.trim());
    const hasUser = Boolean(data.SMTP_USER?.trim());
    const hasPass =
      typeof data.SMTP_PASSWORD === "string" &&
      data.SMTP_PASSWORD.replace(/\s+/g, "").length > 0;

    if (gmail) {
      if (!(data.MAIL_FROM?.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "MAIL_FROM is required when USE_GMAIL_SMTP is true (e.g. Medora <you@gmail.com>)",
          path: ["MAIL_FROM"],
        });
      }
      if (!hasUser) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "SMTP_USER is required when USE_GMAIL_SMTP is true (your Gmail address)",
          path: ["SMTP_USER"],
        });
      }
      if (!hasPass) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "SMTP_PASSWORD is required when USE_GMAIL_SMTP is true (Google App Password, not your login password)",
          path: ["SMTP_PASSWORD"],
        });
      }
      return;
    }

    if (hasHost && !(data.MAIL_FROM?.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MAIL_FROM is required when SMTP_HOST is set",
        path: ["MAIL_FROM"],
      });
    }
    if (!hasHost && (hasUser || hasPass)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Set SMTP_HOST for custom SMTP, or USE_GMAIL_SMTP=true with Gmail credentials",
        path: ["SMTP_HOST"],
      });
    }
  }).safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment:", msg);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return parsed.data;
}
