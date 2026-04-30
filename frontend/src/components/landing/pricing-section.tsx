"use client";

import { useState } from "react";

import type { PricingCardProps } from "./pricing-card";
import { PricingCard } from "./pricing-card";
import { SectionHeading } from "./section-heading";

export function PricingSection({ plans }: { plans: Omit<PricingCardProps, "annual">[] }) {
  const [annual, setAnnual] = useState(false);
  const hasAnnual = plans.some((p) => p.annualPrice != null);

  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans. Cancel anytime."
        description="14-day free trial, no card needed."
        align="center"
      />

      {hasAnnual && (
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm ${!annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={annual}
            onClick={() => setAnnual((a) => !a)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${annual ? "bg-brand" : "bg-muted"}`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-sm ${annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            Annual
            <span className="ml-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Save more
            </span>
          </span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} annual={annual} />
        ))}
      </div>
    </section>
  );
}
