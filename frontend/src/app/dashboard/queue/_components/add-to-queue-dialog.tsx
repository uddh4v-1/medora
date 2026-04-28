"use client";

import { Plus, UserPlus, X } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { doctors } from "@/lib/dashboard-content";
import { useClinicStore } from "@/lib/store";

export type NewVisitInput = {
  patient: string;
  doctor: string;
  reason: string;
  title: string;
};

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export function AddToQueueDialog({
  onCreate,
}: {
  onCreate: (input: NewVisitInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const fieldIdPrefix = useId();
  const patients = useClinicStore((s) => s.patients);

  function reset() {
    setPatientId("");
    setDoctorId(doctors[0]?.id ?? "");
    setReason("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId || !doctorId) return;
    const patient = patients.find((p) => p.id === patientId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!patient || !doctor) return;
    onCreate({
      patient: patient.name,
      doctor: doctor.name,
      reason: reason.trim(),
      title: "Visit",
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
          Add to queue
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-brand/8 via-brand/3 to-transparent px-6 pt-6 pb-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-brand">
                <UserPlus className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight text-foreground">
                  Add to queue
                </DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Check a patient in for today.
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={`${fieldIdPrefix}-patient`}
                className="text-sm font-medium text-foreground"
              >
                Patient
              </Label>
              <Select
                value={patientId}
                onValueChange={setPatientId}
                disabled={patients.length === 0}
              >
                <SelectTrigger
                  id={`${fieldIdPrefix}-patient`}
                  className="!h-10 w-full rounded-lg border-border bg-card text-sm"
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={`${fieldIdPrefix}-doctor`}
                className="text-sm font-medium text-foreground"
              >
                Doctor
              </Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger
                  id={`${fieldIdPrefix}-doctor`}
                  className="!h-10 w-full rounded-lg border-border bg-card text-sm"
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
                htmlFor={`${fieldIdPrefix}-reason`}
                className="text-sm font-medium text-foreground"
              >
                Reason
              </Label>
              <Input
                id={`${fieldIdPrefix}-reason`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. fever follow-up"
                className={fieldClass}
              />
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
              disabled={!patientId || !doctorId}
              className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check in
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
