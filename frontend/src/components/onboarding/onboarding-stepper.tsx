"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  type OnboardingStep,
  ONBOARDING_STEPS,
  WIZARD_STEPS,
} from "@/lib/onboarding-store";

import { STEP_META } from "./step-config";

type Props = {
  current: OnboardingStep;
  furthest: OnboardingStep;
};

// 5 dots, one per wizard step. Past steps are filled green with a check,
// current is filled coral, future are ghost. Past dots are clickable so
// owners can jump back; future dots are disabled.
export function OnboardingStepper({ current, furthest }: Props) {
  const currentIdx = ONBOARDING_STEPS.indexOf(current);
  const furthestIdx = ONBOARDING_STEPS.indexOf(furthest);

  return (
    <ol className="flex items-center gap-2">
      {WIZARD_STEPS.map((step, i) => {
        const meta = STEP_META[step as keyof typeof STEP_META];
        const stepIdx = ONBOARDING_STEPS.indexOf(step);
        const isCurrent = step === current;
        const isPast = stepIdx < currentIdx;
        const isReachable = stepIdx <= furthestIdx;

        const dot = (
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              isPast &&
                "bg-brand text-brand-foreground",
              isCurrent &&
                "bg-brand-coral text-white shadow-[0_0_0_4px_color-mix(in_oklab,var(--brand-coral)_18%,transparent)]",
              !isCurrent &&
                !isPast &&
                "bg-muted text-muted-foreground ring-1 ring-border",
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isPast ? <Check className="size-3.5" /> : i + 1}
          </span>
        );

        return (
          <li key={step} className="flex items-center gap-2">
            {isPast && isReachable ? (
              <Link
                href={meta.href}
                className="group/step flex items-center gap-2"
                aria-label={`Go back to step ${i + 1}: ${meta.shortLabel}`}
              >
                {dot}
                <span className="hidden text-xs font-medium text-muted-foreground transition-colors group-hover/step:text-foreground sm:inline">
                  {meta.shortLabel}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                {dot}
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:inline",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {meta.shortLabel}
                </span>
              </div>
            )}
            {i < WIZARD_STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px w-6 transition-colors sm:w-10",
                  stepIdx < currentIdx ? "bg-brand/60" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
