import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Onboarding — Medora",
  description: "Set up your clinic on Medora.",
};

// The actual chrome lives inside each step page (via `OnboardingShell`),
// because each route knows its own step name. This layout exists mostly to
// scope the `<title>` tag and to give Next.js a place to add per-route
// loading UI later.
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
