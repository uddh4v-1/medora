"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { Input } from "@/components/ui/input";
import { useClinicStore, useHydrated } from "@/lib/store";

import { DashboardPageHeader } from "../_components/page-header";
import { NewPatientDialog } from "./_components/new-patient-dialog";
import { PatientsTable } from "./_components/patients-table";

export default function PatientsPage() {
  const hydrated = useHydrated();
  const patients = useClinicStore((s) => s.patients);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q),
    );
  }, [patients, query]);

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
        eyebrow="Directory"
        title="Patients"
        actions={<NewPatientDialog />}
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="h-10 rounded-lg bg-card pl-9 text-sm shadow-card-soft dark:shadow-none"
        />
      </div>

      <PatientsTable
        patients={filtered}
        hasActiveSearch={query.trim().length > 0}
      />
    </div>
  );
}
