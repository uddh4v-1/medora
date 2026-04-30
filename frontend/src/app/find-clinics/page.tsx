"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

import { BackgroundGlow } from "@/components/landing/background-glow";
import { Logo } from "@/components/landing/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { searchClinics, type ClinicCard } from "@/services/discover.service";

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Orthopedics",
  "Gynecology",
  "Neurology",
  "Dentistry",
  "Ophthalmology",
  "ENT",
];

export default function FindClinicsPage() {
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [results, setResults] = useState<ClinicCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const clinics = await searchClinics({
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        specialty: specialty || undefined,
      });
      setResults(clinics);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const canSearch = city.trim().length > 0 || pincode.trim().length > 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <BackgroundGlow />

      <header className="landing-fade-rise relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center px-6 pb-16 pt-14 text-center">
          <Badge className="landing-fade-rise mb-7 h-7 gap-2 rounded-full border border-border bg-card px-3 text-[12px] font-medium text-muted-foreground">
            <span className="landing-badge-dot size-1.5 rounded-full bg-brand" />
            Clinics near you, instantly
          </Badge>

          <h1 className="landing-fade-rise landing-delay-1 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find the right clinic,{" "}
            <span className="landing-coral-accent text-brand-coral">right now.</span>
          </h1>

          <p className="landing-fade-rise landing-delay-2 mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            Search by city or pincode, filter by specialty, and book an
            appointment in seconds.
          </p>

          {/* Search card */}
          <form
            onSubmit={handleSearch}
            className="landing-fade-rise landing-delay-3 mt-10 w-full max-w-2xl"
          >
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
              {/* Inputs row */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City — e.g. Pune"
                    className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    inputMode="numeric"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !canSearch}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Search className="h-4 w-4" />
                  {loading ? "Searching…" : "Search"}
                </button>
              </div>

              {/* Specialty chips */}
              <div className="mt-4">
                <p className="mb-2.5 text-left text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Specialty
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => {
                    const active = specialty === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpecialty(active ? "" : s)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          active
                            ? "border-brand bg-brand/10 text-brand shadow-brand"
                            : "border-border bg-background text-foreground hover:border-brand/40 hover:bg-brand/5"
                        }`}
                      >
                        {active && <X className="h-3 w-3" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>
        </section>

        {/* Results */}
        {searched && (
          <section className="mx-auto w-full max-w-3xl px-6 pb-20">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-2xl border border-border bg-card"
                  />
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <>
                <p className="mb-5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{results.length}</span>{" "}
                  clinic{results.length !== 1 ? "s" : ""} found
                  {specialty && (
                    <span> · <span className="text-brand">{specialty}</span></span>
                  )}
                  {city && <span> in <span className="font-medium text-foreground">{city}</span></span>}
                </p>
                <div className="flex flex-col gap-4">
                  {results.map((clinic, i) => (
                    <ClinicResultCard key={clinic.id} clinic={clinic} index={i} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Search className="size-5 text-muted-foreground" />
                </span>
                <p className="text-sm font-medium text-foreground">No clinics found</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Try a different city, pincode, or remove the specialty filter.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Empty state CTA — shown before any search */}
        {!searched && (
          <section className="landing-fade-rise landing-delay-4 mx-auto w-full max-w-3xl px-6 pb-20">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: MapPin, label: "By location", body: "Search by city name or 6-digit pincode." },
                { icon: Stethoscope, label: "By specialty", body: "Filter to find exactly the right doctor." },
                { icon: ArrowRight, label: "Book instantly", body: "One click to the clinic's booking page." },
              ].map(({ icon: Icon, label, body }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none"
                >
                  <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}

function ClinicResultCard({ clinic, index }: { clinic: ClinicCard; index: number }) {
  const location = [clinic.address, clinic.city, clinic.state, clinic.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="landing-fade-rise rounded-2xl border border-border bg-card p-5 shadow-card-soft transition-shadow hover:shadow-brand-glow/20 dark:shadow-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {/* Avatar */}
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Stethoscope className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-foreground">
              {clinic.name}
            </h2>

            {clinic.description && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {clinic.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-col gap-1">
              {location && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{location}</span>
                </div>
              )}
              {clinic.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{clinic.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {clinic.doctorCount} team member{clinic.doctorCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {clinic.specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {clinic.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-brand/8 px-2.5 py-0.5 text-[11px] font-medium text-brand"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Link
          href={`/book/${clinic.slug}`}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-medium text-brand-foreground shadow-brand transition-opacity hover:opacity-90"
        >
          Book
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
