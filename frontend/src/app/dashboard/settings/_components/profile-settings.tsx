"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentClinic } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export function ProfileSettings() {
  const { t } = useI18n();
  const [name, setName] = useState(currentClinic.name);
  const [phone, setPhone] = useState(currentClinic.phone);
  const [address, setAddress] = useState(currentClinic.address);
  const [gst, setGst] = useState(currentClinic.gst);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none"
    >
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="clinic-name"
            className="text-sm font-medium text-foreground"
          >
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
          <Label
            htmlFor="clinic-phone"
            className="text-sm font-medium text-foreground"
          >
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
          <Label
            htmlFor="clinic-address"
            className="text-sm font-medium text-foreground"
          >
            {t("common.address")}
          </Label>
          <Input
            id="clinic-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="clinic-gst"
            className="text-sm font-medium text-foreground"
          >
            {t("profile.gst")}
          </Label>
          <Input
            id="clinic-gst"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-6">
        <Button
          type="submit"
          className="h-9 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
        >
          {t("common.saveChanges")}
        </Button>
      </div>
    </form>
  );
}
