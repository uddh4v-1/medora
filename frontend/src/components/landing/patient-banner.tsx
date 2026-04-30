import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PatientBanner() {
  return (
    <div className="relative z-20 flex items-center justify-center gap-3 bg-brand px-4 py-2.5 text-brand-foreground">
      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em]">
        Patients
      </span>
      <p className="text-sm font-medium">
        Looking for a clinic near you?
      </p>
      <Link
        href="/find-clinics"
        className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/25"
      >
        Find one now
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
