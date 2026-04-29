"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  useOnboardingHydrated,
  useOnboardingStore,
} from "@/stores/onboarding-store";

// `/onboarding` itself is a router — we forward the user to whichever step
// they last unlocked. Keeps deep-linking from a "resume onboarding" email or
// dashboard banner one-line easy.
export default function OnboardingIndex() {
  const router = useRouter();
  const hydrated = useOnboardingHydrated();
  const furthest = useOnboardingStore((s) => s.furthestStep);
  const ownerEmail = useOnboardingStore((s) => s.ownerEmail);

  useEffect(() => {
    if (!hydrated) return;
    if (!ownerEmail) {
      router.replace("/signup");
      return;
    }
    const next =
      furthest === "signup"
        ? "/onboarding/verify-email"
        : furthest === "done"
          ? "/onboarding/done"
          : `/onboarding/${furthest}`;
    router.replace(next);
  }, [hydrated, furthest, ownerEmail, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Loading your setup…
    </div>
  );
}
