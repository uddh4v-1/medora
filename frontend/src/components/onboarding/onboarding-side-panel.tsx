"use client";

import { Stethoscope } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { type OnboardingStep, WIZARD_STEPS } from "@/stores/onboarding-store";
import { siteConfig } from "@/lib/site-content";

import { metaForStep, STEP_META } from "./step-config";

type Props = {
  current: OnboardingStep;
};

export function OnboardingSidePanel({ current }: Props) {
  const meta = metaForStep(current);

  return (
    <aside className="relative hidden flex-col justify-between bg-brand p-10 text-brand-foreground lg:flex">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-brand-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-brand-foreground">
          <Stethoscope className="size-[18px]" />
        </span>
        <span className="text-[15px] font-semibold">{siteConfig.name}</span>
      </Link>

      <div className="max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-foreground/60">
          {meta ? `Step ${meta.index} of 5` : "Welcome"}
        </p>
        <h2 className="mt-4 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-[42px]">
          {meta ? meta.panelHeadline : "Let's set up your clinic."}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-foreground/75">
          {meta
            ? meta.panelBody
            : "It takes about five minutes. We'll save your progress as you go."}
        </p>

        <ul className="mt-9 space-y-3">
          {WIZARD_STEPS.map((step) => {
            const sm = STEP_META[step as keyof typeof STEP_META];
            const Icon = sm.icon;
            const isCurrent = step === current;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isCurrent
                    ? "bg-white/12 text-brand-foreground"
                    : "text-brand-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-colors",
                    isCurrent
                      ? "bg-brand-foreground/15 text-brand-foreground"
                      : "bg-brand-foreground/8 text-brand-foreground/60",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="text-[13px] font-medium">{sm.shortLabel}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="font-mono text-[11px] text-brand-foreground/55">
        Stuck? hello@medora.app · we reply within 1 working day.
      </p>
    </aside>
  );
}
