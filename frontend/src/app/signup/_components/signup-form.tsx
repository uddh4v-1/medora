"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SlugPreview } from "@/components/onboarding/slug-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { deriveSlug, useOnboardingStore } from "@/lib/onboarding-store";

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score = 2;
  if (score === 2 && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score = 3;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ["Too short", "Okay", "Good", "Strong"] as const;

export function SignupForm() {
  const router = useRouter();
  const setSignup = useOnboardingStore((s) => s.setSignup);

  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const slug = useMemo(() => deriveSlug(clinicName), [clinicName]);
  const strength = passwordStrength(password);

  const valid =
    clinicName.trim().length >= 2 &&
    phone.trim().length >= 4 &&
    ownerName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
    agree;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setSignup({
      clinicName: clinicName.trim(),
      clinicPhone: phone.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: email.trim().toLowerCase(),
      slug,
    });
    // Mimic a quick API round-trip so the spinner registers visually.
    window.setTimeout(() => {
      toast.success("Welcome to Medora", {
        description: "Let's verify your email and you're off.",
      });
      router.push("/onboarding/verify-email");
    }, 500);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-10 lg:px-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to home
      </Link>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Set up your clinic
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Takes about 5 minutes. No card needed.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <Field label="Clinic name" htmlFor="clinic-name">
            <Input
              id="clinic-name"
              autoComplete="organization"
              placeholder="Sunshine Family Clinic"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="h-11 rounded-lg bg-card px-3 text-sm shadow-sm"
            />
            <SlugPreview slug={slug} className="mt-2" />
          </Field>

          <Field label="Phone" htmlFor="clinic-phone">
            <div className="flex h-11 items-stretch overflow-hidden rounded-lg ring-1 ring-input focus-within:ring-2 focus-within:ring-ring/50">
              <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground">
                +91
              </span>
              <input
                id="clinic-phone"
                type="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </Field>

          <Field label="Your name" htmlFor="owner-name">
            <Input
              id="owner-name"
              autoComplete="name"
              placeholder="Dr. Priya Mehta"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="h-11 rounded-lg bg-card px-3 text-sm shadow-sm"
            />
          </Field>

          <Field label="Email" htmlFor="owner-email">
            <Input
              id="owner-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourclinic.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg bg-card px-3 text-sm shadow-sm"
            />
          </Field>

          <Field label="Password" htmlFor="owner-password">
            <Input
              id="owner-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg bg-card px-3 text-sm shadow-sm"
            />
            <PasswordMeter strength={strength} hasInput={password.length > 0} />
          </Field>

          <label className="mt-1 flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 size-3.5 accent-[var(--brand)]"
            />
            <span>
              I agree to Medora&apos;s{" "}
              <Link
                href="#"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-medium text-foreground underline underline-offset-2"
              >
                DPDP / privacy policy
              </Link>
              .
            </span>
          </label>

          <Button
            type="submit"
            disabled={!valid || submitting}
            className="mt-1 h-11 w-full rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating your clinic…
              </>
            ) : (
              "Create my clinic"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already on Medora?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground transition-colors hover:text-brand"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PasswordMeter({
  strength,
  hasInput,
}: {
  strength: 0 | 1 | 2 | 3;
  hasInput: boolean;
}) {
  if (!hasInput) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Use 8+ characters. Mix cases, numbers and symbols for extra safety.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((tick) => (
          <span
            key={tick}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              tick <= strength
                ? strength === 3
                  ? "bg-brand"
                  : strength === 2
                    ? "bg-brand-coral"
                    : "bg-amber-500"
                : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">
        {STRENGTH_LABEL[strength]}
      </span>
    </div>
  );
}
