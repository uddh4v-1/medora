"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DoctorTabs } from "@/components/onboarding/doctor-tabs";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { WizardFooter } from "@/components/onboarding/wizard-footer";
import { useOnboardingStore } from "@/lib/onboarding-store";

export default function ServicesPage() {
  const router = useRouter();
  const initial = useOnboardingStore((s) => s.doctorServices);
  const setServices = useOnboardingStore((s) => s.setServices);

  const [doctorServices, setDoctorServices] = useState(initial);

  const valid =
    doctorServices.length > 0 &&
    doctorServices.every((d) => d.fee >= 0 && d.specialty.length > 0);

  function handleContinue() {
    setServices({ doctorServices });
    router.push("/onboarding/review");
  }

  return (
    <OnboardingShell step="services">
      <header className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          Step 4 of 5
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Set fees and schedules
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One tab per doctor. We pre-filled sensible defaults — change only
          what matters to you.
        </p>
      </header>

      <WizardCard>
        <DoctorTabs
          doctors={doctorServices}
          onChange={setDoctorServices}
        />
      </WizardCard>

      <WizardFooter
        backHref="/onboarding/team"
        primaryDisabled={!valid}
        onPrimary={handleContinue}
      />
    </OnboardingShell>
  );
}
