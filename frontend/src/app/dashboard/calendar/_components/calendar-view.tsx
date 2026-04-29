"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useClinicStore } from "@/stores/clinic-store";
import { createAppointment } from "@/services/appointments.service";
import type { AppointmentStatus } from "@/lib/dashboard-content";

import { DashboardPageHeader } from "../../_components/page-header";
import { DateStepper } from "./date-stepper";
import { DaySchedule } from "./day-schedule";
import { NewAppointmentDialog } from "./new-appointment-dialog";

type NewAppointmentFormInput = {
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string;
  reason: string;
  startTime: string;
  endTime: string;
};

export function CalendarView({ initialDate }: { initialDate: string }) {
  const appointments = useClinicStore((s) => s.appointments);
  const addAppointment = useClinicStore((s) => s.addAppointment);

  const [day, setDay] = useState(() => new Date(`${initialDate}T00:00:00`));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultTime, setDefaultTime] = useState<string | null>(null);

  async function handleCreate(input: NewAppointmentFormInput) {
    const dateStr = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, "0"),
      String(day.getDate()).padStart(2, "0"),
    ].join("-");

    const res = await createAppointment({
      patientId: input.patientId,
      doctorId: input.doctorId,
      date: dateStr,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason,
    });

    if (!res.ok) {
      toast.error("Failed to book appointment");
      return;
    }

    addAppointment({
      id: res.data.id,
      patient: res.data.patientName,
      doctor: res.data.doctorName ?? "Unassigned",
      startTime: res.data.startTime,
      endTime: res.data.endTime,
      reason: res.data.reason,
      status: res.data.status as AppointmentStatus,
    });
    toast.success("Appointment booked", { description: res.data.patientName });
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
