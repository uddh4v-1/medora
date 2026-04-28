"use client";

import { Plus } from "lucide-react";

import {
  type Appointment,
  calendarSlots,
  format12h,
  isSlotOccupied,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

import { AppointmentCard } from "./appointment-card";

export function DaySchedule({
  visitDate,
  appointments,
  onPickSlot,
}: {
  visitDate: Date;
  appointments: Appointment[];
  onPickSlot?: (slot: string) => void;
}) {
  const startMap = new Map<string, Appointment>();
  for (const a of appointments) {
    startMap.set(a.startTime, a);
  }

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-[80px] w-px bg-border/60"
      />
      {calendarSlots.map((slot, idx) => {
        const apt = startMap.get(slot);
        const isHourMark = slot.endsWith(":00");
        const occupiedByOther = !apt && isSlotOccupied(slot, appointments);

        return (
          <div
            key={slot}
            className={cn(
              "flex items-center px-4 py-1.5",
              idx > 0 && "border-t border-border/60",
              !isHourMark && "border-dashed",
            )}
          >
            <span
              className={cn(
                "w-16 shrink-0 text-xs",
                isHourMark
                  ? "font-medium text-foreground/80"
                  : "text-muted-foreground/70",
              )}
            >
              {slot}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pl-3">
              {apt ? (
                <AppointmentCard visitDate={visitDate} appointment={apt} />
              ) : occupiedByOther ? (
                <span className="block h-7" aria-hidden />
              ) : (
                <button
                  type="button"
                  onClick={() => onPickSlot?.(slot)}
                  className="group flex h-7 w-full items-center justify-between rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 text-[11px] text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
                >
                  <span className="font-medium">Available</span>
                  <span className="inline-flex items-center gap-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="size-3" />
                    Book {format12h(slot)}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
