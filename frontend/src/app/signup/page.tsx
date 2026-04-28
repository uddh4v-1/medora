import type { Metadata } from "next";

import { SignupForm } from "./_components/signup-form";
import { SignupSidePanel } from "./_components/signup-side-panel";

export const metadata: Metadata = {
  title: "Create your clinic — Medora",
  description: "Set up your clinic on Medora in about five minutes.",
};

export default function SignupPage() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <SignupSidePanel />
      <SignupForm />
    </div>
  );
}
