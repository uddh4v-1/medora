"use client";

import { Stethoscope } from "lucide-react";
import Link from "next/link";

import { siteConfig } from "@/lib/site-content";
import { type OnboardingStep, WIZARD_STEPS, useOnboardingStore } from "@/stores/onboarding-store";

import { OnboardingSidePanel } from "./onboarding-side-panel";
import { OnboardingStepper } from "./onboarding-stepper";
import { SaveAndExit } from "./save-and-exit";
import { metaForStep } from "./step-config";

type Props = {
  step: OnboardingStep;
  children: React.ReactNode;
};

export function OnboardingShell({ step, children }: Props) {
  const furthest = useOnboardingStore((s) => s.furthestStep);
  const meta = metaForStep(step);

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[420px_1fr]">
      <OnboardingSidePanel current={step} />

      <div className="relative flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-5 py-4 backdrop-blur supports-backdrop-filter:bg-background/60 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-[14px] font-semibold text-foreground lg:hidden"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground shadow-brand">
              <Stethoscope className="size-4" />
            </span>
            {siteConfig.name}
          </Link>

          <div className="hidden flex-1 lg:block">
            <OnboardingStepper current={step} furthest={furthest} />
          </div>

          <div className="flex items-center gap-4">
            {meta && (
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline lg:hidden">
                Step {meta.index} of {WIZARD_STEPS.length}
              </span>
            )}
            <SaveAndExit />
          </div>
        </header>

        {/* Mobile stepper — hidden on lg, shown below header on smaller screens */}
        <div className="border-b border-border/60 px-5 py-3 lg:hidden">
          <OnboardingStepper current={step} furthest={furthest} />
        </div>

        <main className="flex flex-1 flex-col items-center px-5 py-10 lg:px-10 lg:py-14">
          <div className="w-full max-w-xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
