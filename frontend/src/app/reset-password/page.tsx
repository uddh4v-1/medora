import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginSidePanel } from "@/app/login/_components/login-side-panel";

import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password — Medora",
  description: "Set a new password for your Medora account.",
};

function ResetPasswordFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <LoginSidePanel variant="reset" />
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
