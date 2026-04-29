"use client";

import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhatsappVisitReminderButton } from "@/components/whatsapp-visit-reminder-button";
import {
  type Appointment,
  type AppointmentStatus,
  appointmentStatusLabel,
  appointmentStatuses,
  format12h,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";

const surfaceStyles: Record<AppointmentStatus, string> = {
  scheduled:
    "bg-sky-500/8 ring-sky-500/25 dark:bg-sky-500/10 dark:ring-sky-400/30",
  confirmed:
    "bg-indigo-500/8 ring-indigo-500/25 dark:bg-indigo-500/10 dark:ring-indigo-400/30",
  "in-progress":
    "bg-amber-500/10 ring-amber-500/30 dark:bg-amber-500/12 dark:ring-amber-400/35",
  completed: "bg-brand/8 ring-brand/25 dark:bg-brand/12 dark:ring-brand/35",
  cancelled: "bg-destructive/8 ring-destructive/30",
  "no-show": "bg-rose-500/10 ring-rose-500/30 dark:ring-rose-400/30",
};

const titleStyles: Record<AppointmentStatus, string> = {
  scheduled: "text-sky-700 dark:text-sky-300",
  confirmed: "text-indigo-700 dark:text-indigo-300",
  "in-progress": "text-amber-700 dark:text-amber-300",
  completed: "text-brand dark:text-brand-foreground",
  cancelled: "text-destructive",
  "no-show": "text-rose-700 dark:text-rose-300",
};

export function AppointmentCard({
  visitDate,
  appointment,
}: {
  visitDate: Date;
  appointment: Appointment;
}) {
  const setAppointmentStatus = useClinicStore((s) => s.setAppointmentStatus);
  const status = appointment.status;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 ring-1 transition-colors",
        surfaceStyles[status],
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-medium">
          <span className={cn("truncate", titleStyles[status])}>
            {appointment.patient}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-foreground/85">{appointment.doctor}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
          <span>
            {format12h(appointment.startTime)} – {format12h(appointment.endTime)}
          </span>
          <span>•</span>
          <span>{appointment.reason}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <WhatsappVisitReminderButton
          patientName={appointment.patient}
          visitDate={visitDate}
          startTime24={appointment.startTime}
          endTime24={appointment.endTime}
          doctor={appointment.doctor}
          reason={appointment.reason}
          size="sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Change appointment status"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-foreground/8 px-2.5 py-1.5 text-[11px] font-medium text-foreground/70 outline-none transition-colors hover:bg-foreground/12 focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-foreground/10 dark:text-foreground/75 dark:hover:bg-foreground/15"
            >
              {appointmentStatusLabel[status]}
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuRadioGroup
              value={status}
              onValueChange={(next) =>
                setAppointmentStatus(appointment.id, next as AppointmentStatus)
              }
            >
              {appointmentStatuses.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  {appointmentStatusLabel[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
