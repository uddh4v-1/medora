"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";
import { LogoUploader } from "@/components/onboarding/logo-uploader";
import { WorkingHoursGrid } from "@/components/onboarding/working-hours-grid";
import { Button } from "@/components/ui/button";
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
import { useI18n } from "@/lib/i18n/provider";
import { updateClinic } from "@/services/clinic.service";
import { useClinicStore } from "@/stores/clinic-store";
import { useOnboardingStore, type WorkingHours } from "@/stores/onboarding-store";

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia / Kolkata (IST · GMT+5:30)" },
  { value: "Asia/Dubai", label: "Asia / Dubai (GMT+4)" },
  { value: "Asia/Singapore", label: "Asia / Singapore (GMT+8)" },
  { value: "Europe/London", label: "Europe / London (GMT+0/+1)" },
  { value: "America/New_York", label: "America / New York (GMT-5/-4)" },
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export function ProfileSettings() {
  const { t } = useI18n();
  const clinicProfile = useClinicStore((s) => s.clinicProfile);
  const session = useClinicStore((s) => s.session);
  const updateClinicProfile = useClinicStore((s) => s.updateClinicProfile);
  const ob = useOnboardingStore();
  const setOnboardingProfile = useOnboardingStore((s) => s.setProfile);

  // Clinic identity (API-backed)
  const [name, setName] = useState(clinicProfile?.name ?? session?.clinic?.name ?? "");
  const [phone, setPhone] = useState(clinicProfile?.phone ?? "");

  // Extended profile (onboarding-store-backed, local until backend adds these fields)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(ob.logoDataUrl);
  const [address, setAddress] = useState(ob.address);
  const [gst, setGst] = useState(ob.gst);
  const [timezone, setTimezone] = useState(ob.timezone);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(ob.workingHours);
  const [slotMinutes, setSlotMinutes] = useState(ob.slotMinutes);

  const [saving, setSaving] = useState(false);

  // Sync when clinic profile loads after dashboard hydration
  useEffect(() => {
    if (clinicProfile) {
      setName(clinicProfile.name);
      setPhone(clinicProfile.phone);
    }
  }, [clinicProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateClinic({ name: name.trim(), phone: phone.trim() });
      if (res.ok) {
        updateClinicProfile({ name: name.trim(), phone: phone.trim() });
      } else {
        toast.error(t("common.somethingWentWrong"));
        return;
      }
      setOnboardingProfile({
        logoDataUrl,
        address: address.trim(),
        gst: gst.trim(),
        timezone,
        workingHours,
        slotMinutes,
      });
      toast.success(t("common.changesSaved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-6"
    >
      {/* Clinic basics */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <h3 className="mb-5 text-sm font-semibold text-foreground">Clinic basics</h3>

        <div className="flex flex-col gap-6">
          <LogoUploader value={logoDataUrl} onChange={setLogoDataUrl} />

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clinic-name" className="text-sm font-medium text-foreground">
                {t("profile.clinicName")}
              </Label>
              <Input
                id="clinic-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clinic-phone" className="text-sm font-medium text-foreground">
                {t("common.phone")}
              </Label>
              <Input
                id="clinic-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="clinic-address" className="text-sm font-medium text-foreground">
                {t("common.address")}
              </Label>
              <textarea
                id="clinic-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-17 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clinic-gst" className="text-sm font-medium text-foreground">
                {t("profile.gst")}
              </Label>
              <Input
                id="clinic-gst"
                value={gst}
                onChange={(e) => setGst(e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className={cn(fieldClass, "font-mono tracking-wide")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clinic-tz" className="text-sm font-medium text-foreground">
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="clinic-tz" className="h-10 w-full">
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
      </section>

      {/* Working hours */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Working hours</h3>
        <p className="mb-5 text-xs text-muted-foreground">Default for the whole clinic. Doctors can override per their schedule.</p>

        <WorkingHoursGrid value={workingHours} onChange={setWorkingHours} />

        <div className="mt-5 flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">Default appointment length</Label>
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
        </div>
      </section>

      <div>
        <Button
          type="submit"
          disabled={saving}
          className="h-9 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
