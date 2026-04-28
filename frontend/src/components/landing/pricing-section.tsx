import { plans } from "@/lib/site-content";

import { PricingCard } from "./pricing-card";
import { SectionHeading } from "./section-heading";

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple plans. Cancel anytime."
        description="14-day free trial, no card needed."
        align="center"
      />

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>
    </section>
  );
}
