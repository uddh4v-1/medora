"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { WizardCard } from "@/components/onboarding/wizard-card";
import { WizardFooter } from "@/components/onboarding/wizard-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStore } from "@/stores/onboarding-store";

export default function ProfilePage() {
  const router = useRouter();
  const profile = useOnboardingStore(
    useShallow((s) => ({
      city: s.city,
      specialties: s.specialties,
      workingHours: s.workingHours,
      slotMinutes: s.slotMinutes,
    })),
  );
  const setProfile = useOnboardingStore((s) => s.setProfile);

  const [city, setCity] = useState(profile.city);
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties);
  const [specialtyInput, setSpecialtyInput] = useState("");

  const valid = city.trim().length >= 2;

  function addSpecialty() {
    const val = specialtyInput.trim();
    if (val && !specialties.includes(val)) {
      setSpecialties((prev) => [...prev, val]);
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
    setSpecialties((prev) => prev.filter((x) => x !== s));
  }

  function handleContinue() {
    if (!valid) {
      toast.error("Please enter your clinic city.");
      return;
    }
    setProfile({
      logoDataUrl: null,
      address: "",
      city: city.trim(),
      state: "",
      pincode: "",
      specialties,
      description: "",
      gst: "",
      timezone: "Asia/Kolkata",
      workingHours: profile.workingHours,
      slotMinutes: profile.slotMinutes,
    });
    router.push("/onboarding/team");
  }

  return (
    <OnboardingShell step="profile">
      <header className="mb-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">
          Step 1 of 2
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Where is your clinic?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Just the basics for now — you can add your address, logo and hours from Settings anytime.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <WizardCard>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="specialties">
                Specialties{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
              )}
              <Input
                id="specialties"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={handleSpecialtyKey}
                onBlur={addSpecialty}
                placeholder="e.g. Cardiology — press Enter to add"
              />
              <p className="text-[11px] text-muted-foreground">
                Press Enter or comma to add each specialty.
              </p>
            </div>
          </div>
        </WizardCard>
      </div>

      <WizardFooter primaryDisabled={!valid} onPrimary={handleContinue} />
    </OnboardingShell>
  );
}
