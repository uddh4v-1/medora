import { features } from "@/lib/site-content";

import { FeatureCard } from "./feature-card";
import { SectionHeading } from "./section-heading";

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="What's inside"
        title="Everything a clinic of 1–10 doctors needs."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
