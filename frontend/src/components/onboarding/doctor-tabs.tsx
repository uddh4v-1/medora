"use client";

import { Stethoscope } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DoctorService } from "@/stores/onboarding-store";

import { WorkingHoursGrid } from "./working-hours-grid";

const SPECIALTIES = [
  "General Medicine",
  "Pediatrics",
  "Dermatology",
  "Gynecology",
  "Dentistry",
  "Orthopedics",
  "Cardiology",
  "ENT",
  "Ophthalmology",
  "Psychiatry",
];

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

type Props = {
  doctors: DoctorService[];
  onChange: (next: DoctorService[]) => void;
  className?: string;
};

export function DoctorTabs({ doctors, onChange, className }: Props) {
  if (doctors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/40 px-6 py-10 text-center ring-1 ring-border">
        <Stethoscope className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No doctors yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Go back and either pick &quot;solo&quot; or invite at least one
          doctor — then come back here to set fees and schedules.
        </p>
      </div>
    );
  }

  function patch(idx: number, patch: Partial<DoctorService>) {
    onChange(doctors.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function applyFeeToAll(fee: number) {
    onChange(doctors.map((d) => ({ ...d, fee })));
  }

  return (
    <Tabs defaultValue={doctors[0]?.doctorId} className={cn("w-full", className)}>
      <TabsList className="w-full justify-start overflow-x-auto">
        {doctors.map((d) => (
          <TabsTrigger key={d.doctorId} value={d.doctorId}>
            {d.doctorName}
          </TabsTrigger>
        ))}
      </TabsList>

      {doctors.map((doc, idx) => (
        <TabsContent
          key={doc.doctorId}
          value={doc.doctorId}
          className="flex flex-col gap-5 pt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`fee-${doc.doctorId}`}>
                Consultation fee (₹)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id={`fee-${doc.doctorId}`}
                  type="number"
                  min={0}
                  value={doc.fee}
                  onChange={(e) =>
                    patch(idx, { fee: Number(e.target.value) || 0 })
                  }
                  className="h-10 pl-7"
                />
              </div>
              {doctors.length > 1 && (
                <button
                  type="button"
                  onClick={() => applyFeeToAll(doc.fee)}
                  className="self-start text-[11px] font-medium text-brand transition-colors hover:text-brand/80"
                >
                  Apply ₹{doc.fee} to all doctors
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`spec-${doc.doctorId}`}>Specialty</Label>
              <Select
                value={doc.specialty}
                onValueChange={(v) => patch(idx, { specialty: v })}
              >
                <SelectTrigger
                  id={`spec-${doc.doctorId}`}
                  className="h-10 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Working hours
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.useClinicHours
                    ? "Using your clinic-wide hours."
                    : "Custom hours for this doctor."}
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-foreground ring-1 ring-border">
                <input
                  type="checkbox"
                  checked={doc.useClinicHours}
                  onChange={(e) =>
                    patch(idx, { useClinicHours: e.target.checked })
                  }
                  className="size-3.5 accent-[var(--brand)]"
                />
                Same as clinic
              </label>
            </div>
            {!doc.useClinicHours && (
              <WorkingHoursGrid
                value={doc.customHours}
                onChange={(next) => patch(idx, { customHours: next })}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Slot length</Label>
            <div className="flex flex-wrap gap-2">
              {SLOT_OPTIONS.map((m) => {
                const active = doc.slotMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patch(idx, { slotMinutes: m })}
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
        </TabsContent>
      ))}
    </Tabs>
  );
}
