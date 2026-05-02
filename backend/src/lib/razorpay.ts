import Razorpay from "razorpay";
import { getEnv } from "@/config/env";
import { HttpError } from "@/utils/http-error";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (client) return client;
  const env = getEnv();
  if (!env.Test_Key_ID || !env.Test_Key_Secret) {
    throw new HttpError(503, "Payment gateway is not configured", "PAYMENT_NOT_CONFIGURED");
  }
  client = new Razorpay({ key_id: env.Test_Key_ID, key_secret: env.Test_Key_Secret });
  return client;
}
