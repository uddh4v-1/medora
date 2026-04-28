"use client";

import { MessageCircle, Pill, Printer } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { EmptyPrescriptionsIllustration } from "@/components/empty-states/empty-illustrations";
import { Button } from "@/components/ui/button";
import {
  type Patient,
  type Prescription,
  currentClinic,
} from "@/lib/dashboard-content";
import {
  buildPrescriptionWhatsAppText,
  digitsForWhatsApp,
  whatsAppUrl,
} from "@/lib/whatsapp";

const GRID_ROW =
  "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,80px)_minmax(0,5.5rem)]";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLong(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PrescriptionsTable({
  prescriptions,
  patients,
}: {
  prescriptions: Prescription[];
  patients: Patient[];
}) {
  function sendPrescriptionOnWhatsApp(rx: Prescription) {
    const match = patients.find(
      (p) => p.name.trim().toLowerCase() === rx.patient.trim().toLowerCase(),
    );
    if (!match) {
      toast.error("Link this patient first", {
        description:
          `We couldn’t match “${rx.patient}” to someone in your Patients list with a phone number. Add them under Patients (same name), then try again.`,
      });
      return;
    }
    if (!match.phone?.trim()) {
      toast.error("No mobile number on file", {
        description:
          "Add a phone number for this patient in Patients, then try again.",
      });
      return;
    }
    const digits = digitsForWhatsApp(match.phone);
    if (!digits) {
      toast.error("Could not read this phone number");
      return;
    }
    const printUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/print/rx/${rx.id}`
        : undefined;
    const text = buildPrescriptionWhatsAppText({
      patientName: rx.patient,
      clinicName: currentClinic.name,
      rxNumber: rx.number,
      dateLabel: formatDateLong(rx.date),
      doctor: rx.doctor,
      diagnosis: rx.diagnosis,
      medications: rx.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        notes: m.notes,
      })),
      notes: rx.notes,
      printUrl,
    });
    const url = whatsAppUrl(digits, text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <EmptyPrescriptionsIllustration className="h-32 w-40" />
        <p className="text-sm font-medium text-foreground">
          No prescriptions yet
        </p>
        <p className="text-xs text-muted-foreground">
          Create one with the “+ New prescription” button above.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
      <div
        className={`grid ${GRID_ROW} items-center gap-4 bg-muted/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground`}
      >
        <span>Rx</span>
        <span>Date</span>
        <span>Patient</span>
        <span>Doctor</span>
        <span>Diagnosis</span>
        <span className="text-center">Meds</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-border/60">
        {prescriptions.map((rx) => (
          <li
            key={rx.id}
            className={`grid ${GRID_ROW} items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-muted/20`}
          >
            <span className="truncate font-semibold text-foreground">
              {rx.number}
            </span>
            <span className="truncate text-muted-foreground">
              {formatDate(rx.date)}
            </span>
            <span className="truncate font-medium text-foreground">
              {rx.patient}
            </span>
            <span className="truncate text-muted-foreground">{rx.doctor}</span>
            <span className="truncate text-muted-foreground">
              {rx.diagnosis || "—"}
            </span>
            <span className="justify-self-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                <Pill className="size-3" />
                {rx.medications.length}
              </span>
            </span>
            <span className="flex justify-end gap-1">
              <Button
                asChild
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Print ${rx.number}`}
                className="size-8 rounded-md p-0 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/print/rx/${rx.id}`} target="_blank">
                  <Printer className="size-4" />
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title="Send prescription summary on WhatsApp"
                aria-label={`Send ${rx.number} on WhatsApp`}
                onClick={() => sendPrescriptionOnWhatsApp(rx)}
                className="size-8 rounded-md p-0 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#20bd5a]"
              >
                <MessageCircle className="size-4" />
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
