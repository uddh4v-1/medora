"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { Input } from "@/components/ui/input";
import {
  nextPrescriptionNumber,
  type Prescription,
} from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/lib/store";

import { DashboardPageHeader } from "../_components/page-header";
import {
  type NewPrescriptionInput,
  NewPrescriptionDialog,
} from "./_components/new-prescription-dialog";
import { PrescriptionsTable } from "./_components/prescriptions-table";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default function PrescriptionsPage() {
  const hydrated = useHydrated();
  const prescriptions = useClinicStore((s) => s.prescriptions);
  const patients = useClinicStore((s) => s.patients);
  const addPrescription = useClinicStore((s) => s.addPrescription);
  const [query, setQuery] = useState("");

  function handleCreate(input: NewPrescriptionInput) {
    const newRx: Prescription = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `rx-${Date.now()}`,
      number: nextPrescriptionNumber(prescriptions),
      patient: input.patientName,
      doctor: input.doctorName,
      date: todayIso(),
      diagnosis: input.diagnosis,
      medications: input.medications,
      notes: input.notes,
    };
    addPrescription(newRx);
    toast.success("Prescription saved", { description: newRx.number });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(
      (rx) =>
        rx.number.toLowerCase().includes(q) ||
        rx.patient.toLowerCase().includes(q) ||
        rx.doctor.toLowerCase().includes(q) ||
        rx.diagnosis.toLowerCase().includes(q),
    );
  }, [prescriptions, query]);

  if (!hydrated) {
    return (
      <div className="px-6 py-6 md:px-8">
        <DataListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow="Treatment"
        title="Prescriptions"
        actions={<NewPrescriptionDialog onCreate={handleCreate} />}
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Rx number, patient, doctor, or diagnosis..."
          className="h-10 rounded-lg bg-card pl-9 text-sm shadow-card-soft dark:shadow-none"
        />
      </div>

      <PrescriptionsTable prescriptions={filtered} patients={patients} />
    </div>
  );
}
