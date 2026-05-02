import { BackgroundGlow } from "@/components/landing/background-glow";
import { ContactSection } from "@/components/landing/contact-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { PatientBanner } from "@/components/landing/patient-banner";
import { PatientSection } from "@/components/landing/patient-section";
import type { PricingPlan } from "@/components/landing/pricing-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SectionDivider } from "@/components/landing/section-divider";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { plans as staticPlans } from "@/lib/site-content";
import type { CustomPlan } from "@/services/types/superadmin.types";

function fmtPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function mapDynamic(plans: CustomPlan[]): PricingPlan[] {
  return plans.map((p) => {
    const discountPct =
      p.annualPrice != null && p.price > 0
        ? Math.round((1 - p.annualPrice / p.price) * 100)
        : null;
    return {
      name: p.name,
      price: fmtPrice(p.price),
      annualPrice: p.annualPrice != null ? fmtPrice(p.annualPrice) : null,
      discountPct,
      cadence: "/mo",
      features: p.displayFeatures,
      cta: p.ctaText ?? "Get started",
      ctaVariant: p.highlighted ? ("primary" as const) : ("outline" as const),
      highlighted: p.highlighted,
      planId: p.planId ?? null,
    };
  });
}

function parsePriceStr(s: string): number {
  return parseFloat(s.replace(/[₹,]/g, "")) || 0;
}

function mapStatic(): PricingPlan[] {
  return staticPlans.map((p) => {
    const monthly = parsePriceStr(p.price);
    const annual = p.annualPrice ? parsePriceStr(p.annualPrice) : null;
    const discountPct =
      annual != null && monthly > 0
        ? Math.round((1 - annual / monthly) * 100)
        : null;
    return {
      name: p.name,
      price: p.price,
      annualPrice: p.annualPrice ?? null,
      discountPct,
      cadence: p.cadence,
      features: p.features,
      cta: p.cta,
      ctaVariant: p.ctaVariant,
      highlighted: p.highlighted,
      planId: p.planId,
    };
  });
}

async function fetchPricingPlans(): Promise<PricingPlan[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";
    const res = await fetch(`${base}/api/plans`, { cache: "no-store" });
    if (!res.ok) return mapStatic();
    const data = (await res.json()) as CustomPlan[];
    return data.length > 0 ? mapDynamic(data) : mapStatic();
  } catch {
    return mapStatic();
  }
}

export default async function Home() {
  const plans = await fetchPricingPlans();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <PatientBanner />
      <BackgroundGlow />

      <SiteHeader />

      <main className="relative z-10 flex flex-1 flex-col">
        <HeroSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <PatientSection />
        <SectionDivider />
        <PricingSection plans={plans} />
        <SectionDivider />
        <ContactSection />
        <SiteFooter />
      </main>
    </div>
  );
}
