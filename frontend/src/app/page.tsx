import { BackgroundGlow } from "@/components/landing/background-glow";
import { ContactSection } from "@/components/landing/contact-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { SectionDivider } from "@/components/landing/section-divider";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <BackgroundGlow />

      <SiteHeader />

      <main className="relative z-10 flex flex-1 flex-col">
        <HeroSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <ContactSection />
        <SiteFooter />
      </main>
    </div>
  );
}
