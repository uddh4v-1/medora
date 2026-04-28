import Link from "next/link";

import { EmptyPatientsIllustration } from "@/components/empty-states/empty-illustrations";
import type { Patient } from "@/lib/dashboard-content";

export function PatientsTable({
  patients,
  hasActiveSearch = false,
}: {
  patients: Patient[];
  hasActiveSearch?: boolean;
}) {
  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <EmptyPatientsIllustration className="h-32 w-40" />
        <p className="text-sm font-medium text-foreground">
          {hasActiveSearch ? "No patients match" : "No patients yet"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasActiveSearch
            ? "Try a different name or clear the search to see everyone on file."
            : "Add your first patient to start building the directory."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_72px] items-center gap-4 bg-muted/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Name</span>
        <span>Phone</span>
        <span>Age</span>
        <span>Gender</span>
        <span className="text-right" aria-hidden />
      </div>
      <ul className="divide-y divide-border/60">
        {patients.map((patient) => (
          <li
            key={patient.id}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_72px] items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-muted/20"
          >
            <span className="truncate font-medium text-foreground">
              {patient.name}
            </span>
            <span className="truncate text-muted-foreground">
              {patient.phone}
            </span>
            <span className="text-muted-foreground">
              {patient.age ?? "—"}
            </span>
            <span className="text-muted-foreground">
              {patient.gender ?? "—"}
            </span>
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="justify-self-end text-sm font-medium text-brand transition-colors hover:text-brand/80"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
