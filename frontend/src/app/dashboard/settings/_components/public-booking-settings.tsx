"use client";

import { Copy, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentClinic } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";

const BOOKING_PATH = `/book/${currentClinic.slug}`;
const PUBLIC_BOOKING_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}${BOOKING_PATH}`
    : `https://medora.app${BOOKING_PATH}`;

export function PublicBookingSettings() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(PUBLIC_BOOKING_URL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card-soft dark:shadow-none">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Link2 className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {t("publicBooking.heading")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("publicBooking.hint")}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-1.5">
        <Label
          htmlFor="booking-url"
          className="text-sm font-medium text-foreground"
        >
          {t("common.publicUrl")}
        </Label>
        <div className="flex gap-2">
          <Input
            id="booking-url"
            readOnly
            value={PUBLIC_BOOKING_URL}
            className="h-10 flex-1 rounded-lg border-border bg-card text-sm"
          />
          <Button
            type="button"
            onClick={handleCopy}
            className="h-10 gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
          >
            <Copy className="size-4" />
            {copied ? t("common.copied") : t("common.copy")}
          </Button>
          <Button
            asChild
            type="button"
            variant="outline"
            className="h-10 gap-1.5 rounded-lg border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Link href={BOOKING_PATH} target="_blank">
              <ExternalLink className="size-4" />
              {t("common.open")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
