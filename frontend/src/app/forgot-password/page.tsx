import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginSidePanel } from "@/app/login/_components/login-side-panel";

import { ForgotPasswordPanel } from "./_components/forgot-password-panel";

export const metadata: Metadata = {
  title: "Forgot password — Medora",
  description: "Request a link to reset your Medora account password.",
};

function ForgotPasswordFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <LoginSidePanel variant="forgot" />
      <Suspense fallback={<ForgotPasswordFallback />}>
        <ForgotPasswordPanel />
      </Suspense>
    </div>
  );
}
