"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, MapPin, Navigation, Search, Stethoscope, X } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { SiteFooter } from "@/components/landing/site-footer";
import { searchClinics, type ClinicCard } from "@/services/discover.service";

const SPECIALTIES = [
  "General Medicine", "Cardiology", "Pediatrics", "Dermatology",
  "Orthopedics", "Gynecology", "Neurology", "Dentistry", "Ophthalmology", "ENT",
];

const RADIUS_OPTIONS = [5, 10, 20] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];
type SearchMode = "area" | "name";
type Suggestion = { label: string; lat: number; lng: number };

export default function FindClinicsPage() {
  const [mode, setMode] = useState<SearchMode>("area");
  const [query, setQuery] = useState("");

  // area mode
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [radius, setRadius] = useState<Radius>(10);
  const [locating, setLocating] = useState(false);

  const [specialty, setSpecialty] = useState("");
  const [results, setResults] = useState<ClinicCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Nominatim autocomplete — area mode only, skip when coords already set
  useEffect(() => {
    if (mode !== "area" || coords) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&addressdetails=1`,
          { headers: { "User-Agent": "Medora/1.0" } },
        );
        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        setSuggestions(
          data.map((d) => ({
            label: d.display_name.split(",").slice(0, 3).join(", "),
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          })),
        );
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, coords, mode]);

  const runSearch = useCallback(async (
    params: { lat?: number; lng?: number; radiusKm?: number; name?: string },
    spec: string,
  ) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const clinics = await searchClinics({ ...params, specialty: spec || undefined });
      setResults(clinics);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function selectSuggestion(s: Suggestion) {
    setQuery(s.label);
    setCoords({ ...s });
    setSuggestions([]);
    setShowSuggestions(false);
    void runSearch({ lat: s.lat, lng: s.lng, radiusKm: radius }, specialty);
  }

  function clearSearch() {
    setQuery("");
    setCoords(null);
    setResults(null);
    setHasSearched(false);
    setSuggestions([]);
  }

  function switchMode(m: SearchMode) {
    setMode(m);
    clearSearch();
    setSpecialty("");
  }

  function handleSpecialty(s: string) {
    const next = specialty === s ? "" : s;
    setSpecialty(next);
    if (mode === "area" && coords) {
      void runSearch({ lat: coords.lat, lng: coords.lng, radiusKm: radius }, next);
    } else if (mode === "name" && query.trim().length >= 2) {
      void runSearch({ name: query.trim() }, next);
    }
  }

  function handleRadiusChange(r: Radius) {
    setRadius(r);
    if (coords) void runSearch({ lat: coords.lat, lng: coords.lng, radiusKm: r }, specialty);
  }

  function handleNameSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    void runSearch({ name: query.trim() }, specialty);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setQuery("Current location");
        setCoords({ lat, lng, label: "Current location" });
        setLocating(false);
        void runSearch({ lat, lng, radiusKm: radius }, specialty);
      },
      () => setLocating(false),
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-20">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-foreground">Find a clinic</h1>
        <p className="mb-5 text-sm text-muted-foreground">Search by clinic name or find clinics near an area.</p>

        {/* Mode toggle */}
        <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
          {(["area", "name"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                mode === m
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "area" ? "Near me" : "By name"}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div ref={containerRef} className="relative">
          {mode === "area" ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setCoords(null); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Area or locality — e.g. Koramangala, Bangalore"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                {query && (
                  <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                title="Use my location"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
              >
                {locating ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4" />}
              </button>
            </div>
          ) : (
            <form onSubmit={handleNameSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Clinic name — e.g. City Health Clinic"
                  className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
                {query && (
                  <button type="button" onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={query.trim().length < 2 || loading}
                className="flex h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground shadow-brand hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Search
              </button>
            </form>
          )}

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-1 text-foreground">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Radius selector — area mode only */}
        {mode === "area" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Within:</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRadiusChange(r)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  radius === r
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}

        {/* Specialty chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSpecialty(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                specialty === s
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-card text-muted-foreground hover:border-brand/30 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="mt-7">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {results.length} clinic{results.length !== 1 ? "s" : ""} found
                {specialty && <> · <span className="text-brand">{specialty}</span></>}
                {mode === "area" && coords && (
                  <> within {radius} km of <span className="font-medium text-foreground">{coords.label}</span></>
                )}
              </p>
              <div className="flex flex-col gap-2.5">
                {results.map((clinic) => <ClinicRow key={clinic.id} clinic={clinic} />)}
              </div>
            </>
          ) : hasSearched && !loading ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Search className="mx-auto mb-3 size-7 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No clinics found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "area"
                  ? "Try increasing the radius or searching a different area."
                  : "Check the clinic name and try again."}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {mode === "area"
                ? "Enter an area name or tap the location button to find nearby clinics."
                : "Type a clinic name to search."}
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ClinicRow({ clinic }: { clinic: ClinicCard }) {
  const location = [clinic.city, clinic.state].filter(Boolean).join(", ");
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-shadow hover:shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
        <Stethoscope className="size-4 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{clinic.name}</p>
          {clinic.distanceKm !== undefined && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {clinic.distanceKm} km
            </span>
          )}
        </div>
        {location && <p className="truncate text-xs text-muted-foreground">{location}</p>}
        {clinic.specialties.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {clinic.specialties.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-brand/8 px-2 py-0.5 text-[10px] font-medium text-brand">{s}</span>
            ))}
          </div>
        )}
      </div>
      <Link
        href={`/book/${clinic.slug}`}
        className="shrink-0 flex items-center gap-1 rounded-lg bg-brand px-3.5 py-2 text-xs font-medium text-brand-foreground shadow-brand hover:opacity-90"
      >
        Book <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
