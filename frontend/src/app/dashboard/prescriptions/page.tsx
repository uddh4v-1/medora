"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { Input } from "@/components/ui/input";
import { type Prescription } from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { createPrescription } from "@/services/prescriptions.service";

import { DashboardPageHeader } from "../_components/page-header";
import {
  type NewPrescriptionInput,
  NewPrescriptionDialog,
} from "./_components/new-prescription-dialog";
import { PrescriptionsTable } from "./_components/prescriptions-table";

export default function PrescriptionsPage() {
  const hydrated = useHydrated();
  const prescriptions = useClinicStore((s) => s.prescriptions);
  const patients = useClinicStore((s) => s.patients);
  const addPrescription = useClinicStore((s) => s.addPrescription);
  const [query, setQuery] = useState("");

  async function handleCreate(input: NewPrescriptionInput) {
    const res = await createPrescription({
      patientId: input.patientId,
      doctorId: input.doctorId || null,
      diagnosis: input.diagnosis,
      notes: input.notes || undefined,
      items: input.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        notes: m.notes || undefined,
      })),
    });
    if (!res.ok) {
      toast.error("Failed to save prescription");
      return;
    }
    const newRx: Prescription = {
      id: res.data.id,
      number: res.data.number,
      patient: res.data.patientName,
      doctor: res.data.doctorName ?? "Unassigned",
      date: res.data.date,
      diagnosis: res.data.diagnosis,
      notes: res.data.notes ?? "",
      medications: res.data.items.map((i) => ({
        id: i.id,
        name: i.name,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        notes: i.notes ?? "",
      })),
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
