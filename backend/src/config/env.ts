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
  JWT_EXPIRES_IN: z.string().default("7d"),
  /** HttpOnly cookie name storing the access JWT (`server-side session`) */
  AUTH_COOKIE_NAME: z.string().default("medora_session"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment:", msg);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return parsed.data;
}
