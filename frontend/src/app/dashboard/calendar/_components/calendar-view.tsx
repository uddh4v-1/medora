"use client";

import { useState } from "react";
import { toast } from "sonner";

import { type NewAppointmentInput } from "@/lib/dashboard-content";
import { useClinicStore } from "@/stores/clinic-store";

import { DashboardPageHeader } from "../../_components/page-header";
import { DateStepper } from "./date-stepper";
import { DaySchedule } from "./day-schedule";
import { NewAppointmentDialog } from "./new-appointment-dialog";

export function CalendarView({ initialDate }: { initialDate: string }) {
  const appointments = useClinicStore((s) => s.appointments);
  const addAppointment = useClinicStore((s) => s.addAppointment);

  const [day, setDay] = useState(() => new Date(`${initialDate}T00:00:00`));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultTime, setDefaultTime] = useState<string | null>(null);

  function handleCreate(input: NewAppointmentInput) {
    addAppointment({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `apt-${Date.now()}`,
      patient: input.patient,
      doctor: input.doctor,
      reason: input.reason,
      startTime: input.startTime,
      endTime: input.endTime,
      status: "scheduled",
    });
    toast.success("Appointment booked", { description: input.patient });
  }

  function openNewAt(slot: string) {
    setDefaultTime(slot);
    setDialogOpen(true);
  }

  function handleOpenChange(next: boolean) {
    setDialogOpen(next);
    if (!next) setDefaultTime(null);
  }

  const sorted = [...appointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow="Schedule"
        title="Calendar"
        actions={
          <>
            <DateStepper value={day} onChange={setDay} />
            <NewAppointmentDialog
              open={dialogOpen}
              onOpenChange={handleOpenChange}
              appointments={sorted}
              defaultTime={defaultTime}
              day={day}
              onCreate={handleCreate}
            />
          </>
        }
      />

      <DaySchedule
        visitDate={day}
        appointments={sorted}
        onPickSlot={openNewAt}
      />
    </div>
  );
}
