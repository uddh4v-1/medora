"use client";

import {
  ArrowRight,
  CalendarPlus,
  Check,
  FileText,
  MessageCircle,
  PartyPopper,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { PublicLinkCard } from "@/components/onboarding/public-link-card";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { Button } from "@/components/ui/button";
import { useClinicStore } from "@/stores/clinic-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

const NEXT_STEPS = [
  {
    icon: UserPlus,
    title: "Add your first patient",
    href: "/dashboard/patients",
  },
  {
    icon: CalendarPlus,
    title: "Book a test appointment",
    href: "/dashboard/calendar",
  },
  {
    icon: FileText,
    title: "Customize prescription template",
    href: "/dashboard/settings",
  },
];

export default function DonePage() {
  const clinicName = useOnboardingStore((s) => s.clinicName);
  const slug = useOnboardingStore((s) => s.slug);
  const ownerEmail = useOnboardingStore((s) => s.ownerEmail);
  const session = useClinicStore((s) => s.session);
  const signIn = useClinicStore((s) => s.signIn);

  // Sign the owner into the dashboard session if they haven't been already.
  // Mirrors what the existing /login page does after a successful sign-in.
  useEffect(() => {
    if (session || !ownerEmail) return;
    signIn({
      email: ownerEmail,
      role: "Owner",
      signedInAt: new Date().toISOString(),
    });
  }, [session, signIn, ownerEmail]);

  const waMsg = encodeURIComponent(
    `Hi! You can now book appointments at ${clinicName} online: https://medora.app/book/${slug}`,
  );
  const waHref = `https://wa.me/?text=${waMsg}`;

  return (
    <OnboardingShell step="done">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-coral to-brand text-brand-foreground shadow-brand-lg">
          <PartyPopper className="size-7" />
        </span>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          You&apos;re live.
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {clinicName || "Your clinic"}
          </span>{" "}
          is taking bookings. Here&apos;s your sharable link.
        </p>

        <div className="mt-7 w-full text-left">
          <PublicLinkCard slug={slug} variant="hero" />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <a href={waHref} target="_blank" rel="noreferrer">
                <MessageCircle className="size-3.5" />
                Share on WhatsApp
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
            >
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  "Book your appointment online",
                )}&body=${waMsg}`}
              >
                Email patients
              </a>
            </Button>
          </div>
        </div>

        <WizardCard
          title="What's next"
          description="Quick wins to help you and your team get comfortable."
          className="mt-7 w-full text-left"
        >
          <ul className="flex flex-col gap-1.5">
            {NEXT_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {s.title}
                    </span>
                    <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </WizardCard>

        <Button
          asChild
          className="mt-8 h-11 gap-1.5 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
        >
          <Link href="/dashboard">
            Take me to the dashboard
            <ArrowRight className="size-4" />
          </Link>
        </Button>

        <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex size-4 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Check className="size-2.5" />
          </span>
          Auto-signed in as{" "}
          <span className="font-medium text-foreground">{ownerEmail}</span>
          <Stethoscope className="size-3" />
        </div>
      </div>
    </OnboardingShell>
  );
}
