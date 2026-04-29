"use client";

import { Mail, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/stores/onboarding-store";

const RESEND_SECONDS = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const ownerEmail = useOnboardingStore((s) => s.ownerEmail);
  const verified = useOnboardingStore((s) => s.emailVerified);
  const verifyEmail = useOnboardingStore((s) => s.verifyEmail);
  const setSignup = useOnboardingStore((s) => s.setSignup);
  // `useShallow` keeps the returned object reference stable across renders
  // when its keys are unchanged — without it Zustand v5 would re-render in a
  // loop because each call returns a fresh literal.
  const signupState = useOnboardingStore(
    useShallow((s) => ({
      ownerName: s.ownerName,
      clinicName: s.clinicName,
      clinicPhone: s.clinicPhone,
      slug: s.slug,
    })),
  );

  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [editOpen, setEditOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(ownerEmail);

  // Open/close the "edit email" dialog. We re-seed the input from the latest
  // store value when the dialog opens (in an event handler — never in an
  // effect — so we don't trigger the React 19 set-state-in-effect rule).
  function handleEditOpenChange(open: boolean) {
    setEditOpen(open);
    if (open) setEditEmail(ownerEmail);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(
      () => setCooldown((c) => Math.max(0, c - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [cooldown]);

  function handleResend() {
    if (cooldown > 0) return;
    setCooldown(RESEND_SECONDS);
    toast.success("Verification email sent", {
      description: `Sent again to ${ownerEmail}.`,
    });
  }

  function handleVerify() {
    verifyEmail();
    toast.success("Email verified", {
      description: "Let's set up your clinic profile.",
    });
    router.push("/onboarding/profile");
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(editEmail)) return;
    setSignup({ ...signupState, ownerEmail: editEmail.trim().toLowerCase() });
    setEditOpen(false);
    setCooldown(RESEND_SECONDS);
    toast.success("Email updated", {
      description: `New link sent to ${editEmail}.`,
    });
  }

  return (
    <OnboardingShell step="verify-email">
      <div className="flex flex-col items-center text-center">
        <span
          className={`flex size-14 items-center justify-center rounded-2xl ring-1 ring-brand/30 transition-colors ${
            verified
              ? "bg-brand/10 text-brand"
              : "bg-brand-coral/10 text-brand-coral"
          }`}
        >
          {verified ? (
            <MailCheck className="size-6" />
          ) : (
            <Mail className="size-6" />
          )}
        </span>

        <h1 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {verified ? "Email verified" : "Check your inbox"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {verified ? (
            <>You can move on to the next step.</>
          ) : (
            <>
              We sent a link to{" "}
              <span className="font-medium text-foreground">{ownerEmail}</span>{" "}
              — click it to keep going.
            </>
          )}
        </p>

        <WizardCard className="mt-8 w-full text-left">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <span className="mt-0.5 inline-flex size-1.5 shrink-0 rounded-full bg-brand-coral" />
              <p>
                It can take up to two minutes. If you don&apos;t see it,
                check your spam folder.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="h-10"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
              </Button>

              <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Wrong email? Edit address
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <DialogTitle>Update email address</DialogTitle>
                      <DialogDescription>
                        We&apos;ll send a fresh verification link.
                      </DialogDescription>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="edit-email">New email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        autoFocus
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditOpen(false)}
                        className="h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="h-9 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
                      >
                        Send new link
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </WizardCard>

        <Button
          type="button"
          onClick={handleVerify}
          className="mt-8 h-11 min-w-[220px] rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
        >
          {verified ? "Continue setup" : "I clicked the link — verify"}
        </Button>

        <button
          type="button"
          onClick={() => router.push("/onboarding/profile")}
          className="mt-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip for now — I&apos;ll verify before going live
        </button>
      </div>
    </OnboardingShell>
  );
}
