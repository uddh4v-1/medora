import Link from "next/link";
import { ArrowRight, Clock, MapPin, Stethoscope } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Enter your city",
    body: "Type your city or pincode to find clinics in your area.",
  },
  {
    icon: Stethoscope,
    title: "Filter by specialty",
    body: "Need a cardiologist or a dentist? Filter to the right doctor instantly.",
  },
  {
    icon: Clock,
    title: "Book in seconds",
    body: "Pick a slot and confirm — no phone calls, no waiting on hold.",
  },
];

export function PatientSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-linear-to-br from-brand/8 via-brand/4 to-transparent p-10 md:p-14">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-brand-coral/8 blur-2xl"
        />

        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            For patients
          </p>

          <h2 className="mt-3 max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            Find a clinic near you —
            <br />
            <span className="text-brand">no account needed.</span>
          </h2>

          <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            Every clinic on Medora maintains a public profile. Search by city,
            pincode, or specialty and book directly — it takes under a minute.
          </p>

          {/* Steps */}
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground text-xs font-bold shadow-brand">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="mt-2 hidden w-px flex-1 bg-brand/20 sm:block" />
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-brand" />
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/find-clinics"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-medium text-brand-foreground shadow-brand-lg transition-opacity hover:opacity-90"
            >
              Find a clinic near you
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
