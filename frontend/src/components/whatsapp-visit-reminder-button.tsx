"use client";

import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { currentClinic, format12h } from "@/lib/dashboard-content";
import {
  buildClinicOutreachText,
  buildVisitReminderText,
  digitsForWhatsApp,
  whatsAppUrl,
} from "@/lib/whatsapp";
import { useClinicStore } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";

type Props = {
  patientName: string;
  visitDate: Date;
  startTime24: string;
  endTime24: string;
  doctor: string;
  reason: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
};

function formatVisitDateLabel(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function WhatsappVisitReminderButton({
  patientName,
  visitDate,
  startTime24,
  endTime24,
  doctor,
  reason,
  className,
  size = "sm",
  label = "WhatsApp",
}: Props) {
  const patients = useClinicStore((s) => s.patients);
  const patient = patients.find(
    (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase(),
  );
  const digits = patient?.phone ? digitsForWhatsApp(patient.phone) : null;

  if (!digits) {
    return null;
  }

  const timeLabel = `${format12h(startTime24)} – ${format12h(endTime24)}`;
  const text = buildVisitReminderText({
    patientName,
    clinicName: currentClinic.name,
    visitDateLabel: formatVisitDateLabel(visitDate),
    timeLabel,
    doctor,
    reason: reason || "Consultation",
  });
  const href = whatsAppUrl(digits, text);

  return (
    <Button
      type="button"
      size={size === "sm" ? "icon-sm" : "default"}
      variant="ghost"
      className={cn(
        "shrink-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        size === "md" && "h-9 gap-1.5 px-2.5",
        className,
      )}
      asChild
      title="Open WhatsApp with a visit reminder (draft)"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center"
      >
        <MessageCircle
          className={cn(size === "sm" ? "size-3.5" : "size-4", "shrink-0")}
        />
        {size === "md" ? (
          <span className="text-xs font-medium">{label}</span>
        ) : null}
      </a>
    </Button>
  );
}

/**
 * General clinic message (no specific slot) — e.g. patient profile.
 */
export function WhatsappClinicOutreachButton({
  patientName,
  className,
}: {
  patientName: string;
  className?: string;
}) {
  const patients = useClinicStore((s) => s.patients);
  const patient = patients.find(
    (p) => p.name.trim().toLowerCase() === patientName.trim().toLowerCase(),
  );
  const digits = patient?.phone ? digitsForWhatsApp(patient.phone) : null;

  if (!digits) {
    return null;
  }

  const text = buildClinicOutreachText({
    patientName,
    clinicName: currentClinic.name,
    clinicPhone: currentClinic.phone,
  });
  const href = whatsAppUrl(digits, text);

  return (
    <Button
      type="button"
      size="default"
      variant="outline"
      className={cn(
        "h-9 gap-1.5 border-emerald-500/30 bg-card px-3 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400",
        className,
      )}
      asChild
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        <MessageCircle className="size-4 shrink-0" />
        <span className="text-sm font-medium">WhatsApp</span>
      </a>
    </Button>
  );
}
