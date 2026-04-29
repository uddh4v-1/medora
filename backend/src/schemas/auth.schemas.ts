import { z } from "zod";

import { RESERVED_CLINIC_SLUGS } from "@/constants/clinic";

export const loginBodySchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(1, "Password is required").max(500),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const registerBodySchema = z
  .object({
    clinicName: z.string().trim().min(2, "Clinic name is too short").max(200),
    /** Local UI shows +91 — accept digits/spaces; server normalizes to E.164. */
    phone: z.string().trim().min(4, "Phone is required").max(32),
    ownerName: z.string().trim().min(2, "Name is too short").max(120),
    email: z.string().trim().email("Invalid email").max(320),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(500),
    slug: z
      .string()
      .trim()
      .min(1, "Choose a clinic URL")
      .max(60)
      .regex(slugPattern, "Use lowercase letters, numbers, and single hyphens"),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "You must accept the terms to continue"),
  })
  .superRefine((data, ctx) => {
    const lower = data.slug.toLowerCase();
    if (RESERVED_CLINIC_SLUGS.has(lower)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This clinic URL is reserved — pick another",
        path: ["slug"],
      });
    }
  });

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const forgotPasswordBodySchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

const strongNewPassword = (pw: string) =>
  /[A-Z]/.test(pw) &&
  /[a-z]/.test(pw) &&
  /\d/.test(pw) &&
  /[^A-Za-z0-9]/.test(pw);

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Reset link is invalid").max(600),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(500)
    .refine(strongNewPassword, {
      message:
        "Password must include uppercase and lowercase letters, a number, and a special character",
    }),
});

export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
