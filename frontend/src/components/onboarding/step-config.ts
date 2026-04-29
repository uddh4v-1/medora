import {
  Building2,
  type LucideIcon,
  MailCheck,
  Stethoscope,
  Sparkles,
  UserPlus,
} from "lucide-react";

import type { OnboardingStep } from "@/stores/onboarding-store";

export type StepMeta = {
  step: OnboardingStep;
  index: number;
  href: string;
  title: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  panelHeadline: string;
  panelBody: string;
};

export const STEP_META: Record<
  Exclude<OnboardingStep, "signup" | "done">,
  StepMeta
> = {
  "verify-email": {
    step: "verify-email",
    index: 1,
    href: "/onboarding/verify-email",
    title: "Verify your email",
    shortLabel: "Verify",
    description: "Confirm the address we'll send patients on.",
    icon: MailCheck,
    panelHeadline: "Make sure it's really you.",
    panelBody:
      "Patients see this address on confirmations and reminders. We'll keep it private — used only by Medora and your team.",
  },
  profile: {
    step: "profile",
    index: 2,
    href: "/onboarding/profile",
    title: "Tell us about your clinic",
    shortLabel: "Clinic",
    description: "This is what patients see when they book.",
    icon: Building2,
    panelHeadline: "Your front door, online.",
    panelBody:
      "Logo, address and working hours flow into your booking page, prescriptions and invoices.",
  },
  team: {
    step: "team",
    index: 3,
    href: "/onboarding/team",
    title: "Who else works here?",
    shortLabel: "Team",
    description: "Invite doctors and receptionists, or skip if you're solo.",
    icon: UserPlus,
    panelHeadline: "Run as a team or fly solo.",
    panelBody:
      "We email each invitee a setup link. They pick their own password — you never have to handle it.",
  },
  services: {
    step: "services",
    index: 4,
    href: "/onboarding/services",
    title: "Set fees and schedules",
    shortLabel: "Services",
    description: "One tab per doctor. Sensible defaults are pre-filled.",
    icon: Stethoscope,
    panelHeadline: "Each doctor, their own rhythm.",
    panelBody:
      "Override hours, fees and slot length per doctor — or just keep the clinic default and breeze through.",
  },
  review: {
    step: "review",
    index: 5,
    href: "/onboarding/review",
    title: "Almost there",
    shortLabel: "Review",
    description: "Take a look — anything off? You can edit before going live.",
    icon: Sparkles,
    panelHeadline: "One last look, then live.",
    panelBody:
      "Publishing turns on your public booking page. Don't worry — you can keep editing everything from Settings.",
  },
};

export function metaForStep(step: OnboardingStep): StepMeta | null {
  if (step === "signup" || step === "done") return null;
  return STEP_META[step];
}
