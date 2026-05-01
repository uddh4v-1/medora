"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClinicStore } from "@/stores/clinic-store";
import { verifyPayment, type PlanId, type SubscriptionStatus } from "@/services/billing.service";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setSubscription = useClinicStore((s) => s.setSubscription);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const plan = params.get("plan") as PlanId | null;
    const razorpayOrderId = params.get("razorpay_order_id");
    const razorpayPaymentId = params.get("razorpay_payment_id");
    const razorpaySignature = params.get("razorpay_signature");

    if (!plan || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      toast.error("Invalid payment callback. Please contact support.");
      router.replace("/dashboard/subscription");
      return;
    }

    verifyPayment({ plan, razorpayOrderId, razorpayPaymentId, razorpaySignature })
      .then((res) => {
        if (res.ok) {
          setSubscription(res.data.subscription as SubscriptionStatus);
          toast.success("Payment successful! Your subscription is now active.");
        } else {
          toast.error("Payment received but verification failed. Contact support.");
        }
        router.replace("/dashboard/subscription");
      })
      .catch(() => {
        toast.error("Something went wrong verifying your payment. Contact support.");
        router.replace("/dashboard/subscription");
      });
  }, [params, router, setSubscription]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Verifying your payment…</p>
    </div>
  );
}
