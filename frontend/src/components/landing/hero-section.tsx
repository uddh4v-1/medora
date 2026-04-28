import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroStats } from "@/lib/site-content";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center px-6 pb-28 pt-10 text-center">
      <Badge className="mb-7 h-7 gap-2 rounded-full border border-border bg-card px-3 text-[12px] font-medium text-muted-foreground">
        <span className="size-1.5 rounded-full bg-brand" />
        Built for Indian clinics — DPDP & HIPAA aligned
      </Badge>

      <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
        Run your clinic
        <br />
        without <span className="text-brand-coral">the chaos.</span>
      </h1>

      <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-[17px]">
        Appointments, WhatsApp reminders, digital prescriptions, billing &
        analytics — one calm dashboard your reception, doctors and patients
        will actually love.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          asChild
          className="h-11 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand-lg hover:bg-brand/90"
        >
          <Link href="/signup">
            Start free trial
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-11 rounded-lg border-border bg-card px-5 text-sm text-foreground hover:bg-accent hover:text-foreground"
        >
          <Link href="#features">See how it works</Link>
        </Button>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-x-12 gap-y-2 text-center sm:gap-x-20">
        {heroStats.map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl font-semibold text-foreground md:text-[26px]">
              {stat.value}
            </div>
            <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
