"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { LogoUploader } from "@/components/onboarding/logo-uploader";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { WizardFooter } from "@/components/onboarding/wizard-footer";
import { WorkingHoursGrid } from "@/components/onboarding/working-hours-grid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/onboarding-store";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia / Kolkata (IST · GMT+5:30)" },
  { value: "Asia/Dubai", label: "Asia / Dubai (GMT+4)" },
  { value: "Asia/Singapore", label: "Asia / Singapore (GMT+8)" },
  { value: "Europe/London", label: "Europe / London (GMT+0/+1)" },
  { value: "America/New_York", label: "America / New York (GMT-5/-4)" },
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

export default function ProfilePage() {
  const router = useRouter();
  const profile = useOnboardingStore(
    useShallow((s) => ({
      logoDataUrl: s.logoDataUrl,
      address: s.address,
      gst: s.gst,
      timezone: s.timezone,
      workingHours: s.workingHours,
      slotMinutes: s.slotMinutes,
    })),
  );
  const setProfile = useOnboardingStore((s) => s.setProfile);

  const [logoDataUrl, setLogoDataUrl] = useState(profile.logoDataUrl);
  const [address, setAddress] = useState(profile.address);
  const [gst, setGst] = useState(profile.gst);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [workingHours, setWorkingHours] = useState(profile.workingHours);
  const [slotMinutes, setSlotMinutes] = useState(profile.slotMinutes);

  const hasOpenDay = Object.values(workingHours).some((d) => d !== null);
  const valid = address.trim().length >= 4 && hasOpenDay;

  function handleContinue() {
    if (!valid) {
      toast.error("Add a clinic address and at least one open day.");
      return;
    }
    setProfile({
      logoDataUrl,
      address: address.trim(),
      gst: gst.trim(),
      timezone,
      workingHours,
      slotMinutes,
    });
    router.push("/onboarding/team");
  }

  return (
    <OnboardingShell step="profile">
      <header className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          Step 2 of 5
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Tell us about your clinic
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is what patients see when they book. You can change it anytime
          from Settings.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <WizardCard
          title="Clinic basics"
          description="Logo, address and any GST number you bill under."
        >
          <div className="flex flex-col gap-5">
            <LogoUploader value={logoDataUrl} onChange={setLogoDataUrl} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="12, MG Road, Bangalore 560001"
                className="min-h-[68px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gst">
                  GST number{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="gst"
                  value={gst}
                  onChange={(e) => setGst(e.target.value.toUpperCase())}
                  placeholder="29ABCDE1234F1Z5"
                  className="h-10 font-mono text-[13px] tracking-wide"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tz">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="tz" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </WizardCard>

        <WizardCard
          title="Working hours"
          description="Default for the whole clinic. You can override per doctor in the next step."
        >
          <WorkingHoursGrid
            value={workingHours}
            onChange={setWorkingHours}
          />

          <div className="mt-5 flex flex-col gap-2">
            <Label>Default appointment length</Label>
            <div className="flex flex-wrap gap-2">
              {SLOT_OPTIONS.map((m) => {
                const active = slotMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSlotMinutes(m)}
                    className={cn(
                      "h-9 rounded-md px-3.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand text-brand-foreground shadow-brand"
                        : "bg-muted text-foreground hover:bg-muted/80",
                    )}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Drives how patients see slots on your booking page.
            </p>
          </div>
        </WizardCard>
      </div>

      <WizardFooter
        backHref="/onboarding/verify-email"
        primaryDisabled={!valid}
        onPrimary={handleContinue}
      />
    </OnboardingShell>
  );
}
