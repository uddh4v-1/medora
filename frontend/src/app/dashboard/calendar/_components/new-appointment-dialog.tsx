"use client";

import {
  CalendarIcon,
  CalendarPlus,
  CalendarX,
  FileText,
  Plus,
  Stethoscope,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  addMinutes,
  type Appointment,
  currentClinic,
  doctors,
  format12h,
  getAvailableSlots,
  type NewAppointmentInput,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  appointments?: Appointment[];
  defaultTime?: string | null;
  day?: Date;
  onCreate?: (input: NewAppointmentInput) => void;
};

export function NewAppointmentDialog({
  open: controlledOpen,
  onOpenChange,
  appointments = [],
  defaultTime,
  day: scheduleDay = new Date(),
  onCreate,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const formattedDate = useMemo(
    () =>
      scheduleDay.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [scheduleDay],
  );

  const availableSlots = useMemo(
    () => getAvailableSlots(appointments),
    [appointments],
  );

  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState(doctors[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const patients = useClinicStore((s) => s.patients);

  useEffect(() => {
    if (!open) return;
    setSlot(
      defaultTime && availableSlots.includes(defaultTime)
        ? defaultTime
        : (availableSlots[0] ?? null),
    );
  }, [open, defaultTime, availableSlots]);

  function reset() {
    setPatient("");
    setDoctor(doctors[0]?.id ?? "");
    setReason("");
    setSlot(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient || !doctor || !slot) return;
    const patientName =
      patients.find((p) => p.id === patient)?.name ?? patient;
    const doctorName = doctors.find((d) => d.id === doctor)?.name ?? doctor;
    onCreate?.({
      patient: patientName,
      doctor: doctorName,
      reason: reason.trim() || "Consultation",
      startTime: slot,
      endTime: addMinutes(slot, 30),
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-9 gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
          <Plus className="size-4" />
          New
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="relative flex items-start gap-3 border-b border-border bg-gradient-to-br from-brand/8 via-brand/3 to-transparent px-6 pt-6 pb-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-brand">
              <CalendarPlus className="size-5" />
            </span>
            <div className="flex-1 pr-6">
              <DialogTitle className="text-base font-semibold leading-tight text-foreground">
                New appointment
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Book a visit at {currentClinic.name} for {formattedDate}.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 size-7 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <span aria-hidden className="text-base leading-none">
                  ×
                </span>
              </Button>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="patient"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <User className="size-3.5" />
                Patient
              </Label>
              <Select
                value={patient}
                onValueChange={setPatient}
                disabled={patients.length === 0}
              >
                <SelectTrigger
                  id="patient"
                  className="h-10 w-full rounded-lg border-border bg-card text-sm"
                >
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {p.name}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{p.phone}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patients.length === 0 ? (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  No patients yet.
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-brand transition-colors hover:text-brand/80"
                  >
                    <UserPlus className="size-3" />
                    Add new patient
                  </button>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="doctor"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <Stethoscope className="size-3.5" />
                Doctor
              </Label>
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger
                  id="doctor"
                  className="h-10 w-full rounded-lg border-border bg-card text-sm"
                >
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} • {d.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="reason"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <FileText className="size-3.5" />
                Reason
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. fever follow-up"
                className="h-10 rounded-lg border-border bg-card text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CalendarIcon className="size-3.5" />
                  Available slots
                </Label>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {formattedDate}
                </span>
              </div>

              {availableSlots.length === 0 ? (
                <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center">
                  <CalendarX className="mb-1 size-5 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">
                    No slots available
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Day is fully booked.
                  </p>
                </div>
              ) : (
                <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                  {availableSlots.map((s) => {
                    const selected = slot === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={cn(
                          "rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors",
                          selected
                            ? "bg-brand text-brand-foreground shadow-brand"
                            : "bg-card text-foreground hover:bg-brand/8 hover:text-brand",
                        )}
                      >
                        {format12h(s)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-6 py-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!patient || !doctor || !slot}
              className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Book appointment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
