"use client";

import { Pill, Plus, Trash2, X } from "lucide-react";
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
import {
  doctors,
  durationOptions,
  frequencyOptions,
  type Medication,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/lib/store";

const fieldClass =
  "h-10 rounded-lg border-border bg-card text-sm focus-visible:ring-brand/40";

export type NewPrescriptionInput = {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  notes: string;
  medications: Medication[];
};

const emptyMed = (): Medication => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `m-${Date.now()}`,
  name: "",
  dosage: "",
  frequency: "1-0-1",
  duration: "5 days",
  notes: "",
});

export function NewPrescriptionDialog({
  onCreate,
  defaultPatientId,
  trigger,
  lockPatient,
}: {
  onCreate: (input: NewPrescriptionInput) => void;
  defaultPatientId?: string;
  trigger?: React.ReactNode;
  lockPatient?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState(defaultPatientId ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<Medication[]>([emptyMed()]);

  const fieldIdPrefix = useId();
  const patients = useClinicStore((s) => s.patients);

  function updateMed(id: string, patch: Partial<Omit<Medication, "id">>) {
    setMeds((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  function addMed() {
    setMeds((prev) => [...prev, emptyMed()]);
  }

  function removeMed(id: string) {
    setMeds((prev) => (prev.length === 1 ? prev : prev.filter((m) => m.id !== id)));
  }

  function reset() {
    setPatientId(defaultPatientId ?? "");
    setDoctorId(doctors[0]?.id ?? "");
    setDiagnosis("");
    setNotes("");
    setMeds([emptyMed()]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patientId || !doctorId) return;
    const validMeds = meds.filter((m) => m.name.trim());
    if (validMeds.length === 0) return;
    const patient = patients.find((p) => p.id === patientId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!patient || !doctor) return;
    onCreate({
      patientId,
      patientName: patient.name,
      doctorId,
      doctorName: doctor.name,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      medications: validMeds.map((m) => ({
        ...m,
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        notes: m.notes.trim(),
      })),
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
        {trigger ?? (
          <Button className="h-9 gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90">
            <Plus className="size-4" />
            New prescription
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-brand/8 via-brand/3 to-transparent px-6 pt-6 pb-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-brand">
                <Pill className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight text-foreground">
                  New prescription
                </DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Add diagnosis and medications for the patient.
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

          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  disabled={patients.length === 0 || lockPatient}
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
                          <span className="text-muted-foreground">
                            {p.phone}
                          </span>
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={`${fieldIdPrefix}-diagnosis`}
                className="text-sm font-medium text-foreground"
              >
                Diagnosis
              </Label>
              <Input
                id={`${fieldIdPrefix}-diagnosis`}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Viral fever"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  Medications
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {meds.length} item{meds.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {meds.map((m, idx) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border bg-muted/20 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Pill className="size-3" />
                        Medication {idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove medication"
                        onClick={() => removeMed(m.id)}
                        disabled={meds.length === 1}
                        className="size-7 text-muted-foreground hover:text-destructive disabled:opacity-40"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <Input
                        aria-label="Medicine name"
                        value={m.name}
                        onChange={(e) =>
                          updateMed(m.id, { name: e.target.value })
                        }
                        placeholder="Medicine name"
                        className={fieldClass}
                      />
                      <Input
                        aria-label="Dosage"
                        value={m.dosage}
                        onChange={(e) =>
                          updateMed(m.id, { dosage: e.target.value })
                        }
                        placeholder="500mg"
                        className={fieldClass}
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Select
                        value={m.frequency}
                        onValueChange={(next) =>
                          updateMed(m.id, { frequency: next })
                        }
                      >
                        <SelectTrigger
                          aria-label="Frequency"
                          className="!h-10 w-full rounded-lg border-border bg-card text-sm"
                        >
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={m.duration}
                        onValueChange={(next) =>
                          updateMed(m.id, { duration: next })
                        }
                      >
                        <SelectTrigger
                          aria-label="Duration"
                          className="!h-10 w-full rounded-lg border-border bg-card text-sm"
                        >
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Input
                      aria-label="Notes"
                      value={m.notes}
                      onChange={(e) =>
                        updateMed(m.id, { notes: e.target.value })
                      }
                      placeholder="Notes (e.g. after meals)"
                      className={`${fieldClass} mt-2`}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMed}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand/80"
              >
                <Plus className="size-4" />
                Add medication
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor={`${fieldIdPrefix}-notes`}
                className="text-sm font-medium text-foreground"
              >
                Advice / Notes
              </Label>
              <textarea
                id={`${fieldIdPrefix}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="General advice, follow-up instructions..."
                className="min-h-[72px] resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
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
              disabled={
                !patientId ||
                !doctorId ||
                meds.every((m) => !m.name.trim())
              }
              className="h-9 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create prescription
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
