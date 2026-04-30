"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      specialties: s.specialties,
      description: s.description,
      gst: s.gst,
      timezone: s.timezone,
      workingHours: s.workingHours,
      slotMinutes: s.slotMinutes,
    })),
  );
  const setProfile = useOnboardingStore((s) => s.setProfile);

  const [logoDataUrl, setLogoDataUrl] = useState(profile.logoDataUrl);
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city);
  const [state, setState] = useState(profile.state);
  const [pincode, setPincode] = useState(profile.pincode);
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [description, setDescription] = useState(profile.description);
  const [gst, setGst] = useState(profile.gst);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [workingHours, setWorkingHours] = useState(profile.workingHours);
  const [slotMinutes, setSlotMinutes] = useState(profile.slotMinutes);

  const hasOpenDay = Object.values(workingHours).some((d) => d !== null);
  const valid = address.trim().length >= 4 && city.trim().length >= 2 && hasOpenDay;

  function addSpecialty() {
    const val = specialtyInput.trim();
    if (val && !specialties.includes(val)) {
      setSpecialties([...specialties, val]);
    }
    setSpecialtyInput("");
  }

  function handleSpecialtyKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSpecialty();
    }
  }

  function removeSpecialty(s: string) {
    setSpecialties(specialties.filter((x) => x !== s));
  }

  function handleContinue() {
    if (!valid) {
      toast.error("Add a clinic address, city, and at least one open day.");
      return;
    }
    setProfile({
      logoDataUrl,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      specialties,
      description: description.trim(),
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
          This is what patients see when they search for clinics. You can change it anytime from Settings.
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
                placeholder="12, MG Road"
                className="min-h-17 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Karnataka"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="560001"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="specialties">
                Specialties{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-1">
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(s)}
                      className="ml-0.5 rounded-full hover:text-brand/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                id="specialties"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={handleSpecialtyKey}
                onBlur={addSpecialty}
                placeholder="e.g. Cardiology — press Enter to add"
              />
              <p className="text-[11px] text-muted-foreground">Press Enter or comma to add each specialty.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">
                About your clinic{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description patients will see when searching for clinics near them."
                className="min-h-17 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
