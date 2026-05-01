import Razorpay from "razorpay";
import { getEnv } from "@/config/env";
import { HttpError } from "@/utils/http-error";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (client) return client;
  const env = getEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(503, "Payment gateway is not configured", "PAYMENT_NOT_CONFIGURED");
  }
  client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
}
