import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z.string().min(1, "Password is required").max(500),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const registerBodySchema = z.object({
  email: z.string().trim().email("Invalid email").max(320),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(500),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
