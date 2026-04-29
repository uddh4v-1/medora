"use client";

import {
  addMonths,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Stethoscope,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addMinutes,
  calendarSlots,
  currentClinic,
  format12h,
  type Patient,
} from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4 | 5;

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function prettyDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Inline calendar card — full visibility on mobile/desktop (no cramped popover). */
function BookingCalendarCard({
  date,
  bookingWindow,
  onSelect,
}: {
  date: Date | undefined;
  bookingWindow: { today: Date; latest: Date };
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Pick any open day—you can reserve slots within the next four months
        {" "}(including today).
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-soft ring-1 ring-foreground/[0.04] dark:ring-white/10">
        <div className="border-b border-border/70 bg-gradient-to-br from-brand/[0.12] via-brand/[0.06] to-transparent px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-brand">
              <CalendarDays className="size-[1.35rem]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Appointment date
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-[13px]">
                Use ← → beside the month to browse. Dates before today aren’t
                available.
              </p>
            </div>
          </div>
        </div>

        <div className="relative bg-muted/25 px-2 pb-8 pt-6 sm:px-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--brand)_12%,transparent)_0%,transparent_65%)]"
          />
          <div
            className={cn(
              "relative mx-auto w-full max-w-[min(22rem,100%)] rounded-2xl border border-border/90 bg-background/95 p-1 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--foreground)_6%,transparent)] backdrop-blur-sm dark:bg-card/95",
              "[&_button[data-selected-single]]:!border-brand/40 [&_button[data-selected-single]]:!bg-brand [&_button[data-selected-single]]:!text-brand-foreground [&_button[data-selected-single]]:!shadow-md [&_button[data-selected-single]]:shadow-brand/30",
              "[&_button:hover]:z-10 [&_button:not([data-selected-single])]:hover:bg-brand/8",
            )}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="label"
              navLayout="around"
              defaultMonth={date ?? bookingWindow.today}
              startMonth={bookingWindow.today}
              endMonth={bookingWindow.latest}
              fromYear={bookingWindow.today.getFullYear()}
              toYear={bookingWindow.latest.getFullYear()}
              fromDate={bookingWindow.today}
              toDate={bookingWindow.latest}
              weekStartsOn={1}
              showOutsideDays
              onSelect={onSelect}
              disabled={(d) => {
                const day = startOfDay(d);
                return (
                  isBefore(day, bookingWindow.today) ||
                  isAfter(day, bookingWindow.latest)
                );
              }}
              className="w-full bg-transparent p-3 [--cell-size:2.75rem]"
              buttonVariant="outline"
              classNames={{
                /** With navLayout="around": [prev][caption][next] — avoid flex-col + caption w-full (huge gaps). */
                month: cn(
                  "!flex w-full max-w-none flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-5 !px-0 [&>[role=grid]]:mt-1 [&>[role=grid]]:w-full [&>[role=grid]]:basis-full",
                ),
                month_caption: cn(
                  "!h-auto !min-h-0 !w-fit shrink-0 grow-0 justify-center border-0 !px-1 !py-0 [--cell-size:2.75rem]",
                ),
                caption_label:
                  "text-[0.9375rem] font-semibold tracking-tight text-foreground sm:text-[1rem]",
                button_previous:
                  "!static shrink-0 shadow-none [--cell-size:2.5rem]",
                button_next:
                  "!static shrink-0 shadow-none [--cell-size:2.5rem]",
              }}
            />
          </div>
        </div>

        <footer className="border-t border-border/70 bg-muted/20 px-5 py-3.5 sm:px-6">
          {date ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Check className="size-3.5" strokeWidth={2.5} />
                </span>
                <span>
                  <span className="font-medium">{format(date, "EEEE")}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="font-medium tabular-nums">
                    {format(date, "MMMM d, yyyy")}
                  </span>
                </span>
              </p>
              <span className="rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/70">
                Through {format(bookingWindow.latest, "MMM d, yyyy")}
              </span>
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:text-sm">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand/70" aria-hidden />
              Select a date to unlock time slots
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

export function PublicBookingFlow() {
  const hydrated = useHydrated();

  const teamMembers = useClinicStore((s) => s.teamMembers);
  const appointments = useClinicStore((s) => s.appointments);
  const patients = useClinicStore((s) => s.patients);
  const addAppointment = useClinicStore((s) => s.addAppointment);
  const addPatient = useClinicStore((s) => s.addPatient);

  const doctors = useMemo(
    () => teamMembers.filter((m) => m.role === "Doctor"),
    [teamMembers],
  );

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const step: Step = !doctorId
    ? 1
    : !date
      ? 2
      : !slot
        ? 3
        : !confirmedId
          ? 4
          : 5;

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId) ?? null,
    [doctors, doctorId],
  );

  const occupied = useMemo(() => {
    if (!selectedDoctor) return new Set<string>();
    const taken = new Set<string>();
    appointments
      .filter((a) => a.doctor === selectedDoctor.name)
      .forEach((a) => {
        let cur = a.startTime;
        while (cur < a.endTime) {
          taken.add(cur);
          cur = addMinutes(cur, 30);
        }
      });
    return taken;
  }, [appointments, selectedDoctor]);

  const bookingWindow = useMemo(() => {
    const today = startOfDay(new Date());
    const latest = startOfDay(addMonths(new Date(), 4));
    return { today, latest };
  }, []);

  const grouped = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];
    calendarSlots.forEach((s) => {
      const h = Number(s.split(":")[0]);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    });
    return { morning, afternoon, evening };
  }, []);

  function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedDoctor || !date || !slot || !name.trim() || !phone.trim())
      return;

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    const existing = patients.find(
      (p) => p.phone === cleanPhone || p.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (!existing) {
      const newPatient: Patient = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `p-${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        age: null,
        gender: null,
      };
      addPatient(newPatient);
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `apt-${Date.now()}`;

    addAppointment({
      id,
      patient: cleanName,
      doctor: selectedDoctor.name,
      reason: reason.trim() || "Online booking",
      startTime: slot,
      endTime: addMinutes(slot, 30),
      status: "scheduled",
    });

    setConfirmedId(id);
    toast.success("Appointment requested", { description: cleanName });
  }

  function reset() {
    setDoctorId(null);
    setDate(undefined);
    setSlot(null);
    setName("");
    setPhone("");
    setReason("");
    setConfirmedId(null);
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Stethoscope className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-base font-semibold text-foreground">
                {currentClinic.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Book an appointment online
              </p>
            </div>
          </div>
          <div className="hidden flex-col items-end text-right text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              {currentClinic.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {currentClinic.address}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        {step !== 5 ? (
          <Stepper step={step} />
        ) : null}

        {step === 5 && confirmedId && selectedDoctor && date && slot ? (
          <ConfirmationCard
            patientName={name}
            doctor={selectedDoctor.name}
            date={prettyDate(date)}
            slot={slot}
            onAnother={reset}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-5">
              <Section
                title="Choose your doctor"
                stepIndex={1}
                active={step === 1}
                done={step > 1}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {doctors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No doctors available right now.
                    </p>
                  ) : (
                    doctors.map((d) => {
                      const active = doctorId === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDoctorId(d.id);
                            setSlot(null);
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                            active
                              ? "border-brand ring-2 ring-brand/30"
                              : "border-border hover:border-brand/40",
                          )}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                            {d.name
                              .replace(/^Dr\.?\s+/i, "")
                              .split(" ")
                              .map((s) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div className="flex flex-1 flex-col leading-tight">
                            <span className="text-sm font-semibold text-foreground">
                              {d.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {d.specialty ?? "General"}
                            </span>
                            {d.fee != null ? (
                              <span className="mt-0.5 text-[11px] text-muted-foreground">
                                Consultation fee · ₹{d.fee}
                              </span>
                            ) : null}
                          </div>
                          {active ? (
                            <Check className="size-4 text-brand" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </Section>

              {doctorId ? (
                <Section
                  title="Pick a date"
                  stepIndex={2}
                  active={step === 2}
                  done={step > 2}
                >
                  <BookingCalendarCard
                    date={date}
                    bookingWindow={bookingWindow}
                    onSelect={(d) => {
                      setDate(d);
                      setSlot(null);
                    }}
                  />
                </Section>
              ) : null}

              {doctorId && date ? (
                <Section
                  title="Pick a time"
                  stepIndex={3}
                  active={step === 3}
                  done={step > 3}
                >
                  <div className="flex flex-col gap-4">
                    {(["morning", "afternoon", "evening"] as const).map(
                      (period) => (
                        <div key={period}>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {period}
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {grouped[period].map((s) => {
                              const taken = occupied.has(s);
                              const active = slot === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={taken}
                                  onClick={() => setSlot(s)}
                                  className={cn(
                                    "h-9 rounded-md border text-xs font-medium transition-colors",
                                    taken
                                      ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/60 line-through"
                                      : active
                                        ? "border-brand bg-brand text-brand-foreground"
                                        : "border-border bg-card text-foreground hover:border-brand/40 hover:bg-brand/5",
                                  )}
                                >
                                  {format12h(s)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </Section>
              ) : null}

              {doctorId && date && slot ? (
                <Section
                  title="Your details"
                  stepIndex={4}
                  active={step === 4}
                  done={false}
                >
                  <form
                    onSubmit={handleConfirm}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="public-name">Full name</Label>
                        <Input
                          id="public-name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="h-10 rounded-lg bg-card"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="public-phone">Phone</Label>
                        <Input
                          id="public-phone"
                          required
                          inputMode="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98xxxxxxx"
                          className="h-10 rounded-lg bg-card"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="public-reason">
                        Reason for visit{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="public-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Routine check, fever, follow-up…"
                        className="h-10 rounded-lg bg-card"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        className="h-10 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
                      >
                        Confirm appointment
                      </Button>
                    </div>
                  </form>
                </Section>
              ) : null}
            </div>

            <SummaryCard
              clinic={currentClinic.name}
              doctor={selectedDoctor?.name}
              date={date ? prettyDate(date) : null}
              slot={slot}
              isoDate={date ? isoDate(date) : null}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card/80">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-6 py-4 text-[11px] text-muted-foreground">
          <p>Powered by Medora</p>
          <p>Need help? Call {currentClinic.phone}</p>
        </div>
      </footer>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: "Doctor" },
    { id: 2, label: "Date" },
    { id: 3, label: "Time" },
    { id: 4, label: "Details" },
  ];
  return (
    <ol className="flex items-center gap-2 text-xs">
      {steps.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                done
                  ? "border-brand bg-brand text-brand-foreground"
                  : active
                    ? "border-brand text-brand"
                    : "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3" /> : s.id}
            </span>
            <span
              className={cn(
                "font-medium",
                active
                  ? "text-foreground"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 ? (
              <span
                className={cn(
                  "h-px w-6",
                  done ? "bg-brand" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  stepIndex,
  active,
  done,
  children,
}: {
  title: string;
  stepIndex: number;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card p-5 transition-colors",
        active ? "border-brand/40 shadow-card-soft" : "border-border",
      )}
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
            done
              ? "bg-brand text-brand-foreground"
              : active
                ? "bg-brand/15 text-brand"
                : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <Check className="size-3.5" /> : stepIndex}
        </span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function SummaryCard({
  clinic,
  doctor,
  date,
  slot,
  isoDate,
}: {
  clinic: string;
  doctor: string | undefined;
  date: string | null;
  slot: string | null;
  isoDate: string | null;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card-soft lg:sticky lg:top-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Booking summary
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{clinic}</p>

      <ul className="mt-4 flex flex-col gap-3 text-sm">
        <SummaryRow
          icon={Stethoscope}
          label="Doctor"
          value={doctor ?? "Choose a doctor"}
        />
        <SummaryRow
          icon={CalendarDays}
          label="Date"
          value={date ?? "Pick a date"}
          hint={isoDate ?? undefined}
        />
        <SummaryRow
          icon={Clock}
          label="Time"
          value={slot ? format12h(slot) : "Pick a time"}
        />
      </ul>

      <div className="mt-4 rounded-lg bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <User className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Please arrive 10 minutes before your slot. Bring previous reports
            if any.
          </span>
        </p>
      </div>
    </aside>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 items-center justify-center rounded-md bg-brand/10 text-brand">
        <Icon className="size-3.5" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{value}</span>
        {hint ? (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </li>
  );
}

function ConfirmationCard({
  patientName,
  doctor,
  date,
  slot,
  onAnother,
}: {
  patientName: string;
  doctor: string;
  date: string;
  slot: string;
  onAnother: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-border bg-card p-8 text-center shadow-card-soft">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Check className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          You're booked!
        </h2>
        <p className="text-sm text-muted-foreground">
          Hi {patientName.split(" ")[0]}, your appointment is confirmed.
          We've shared the details on your phone.
        </p>
      </div>

      <ul className="grid w-full grid-cols-1 gap-2 rounded-xl bg-muted/40 p-4 text-sm">
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Doctor</span>
          <span className="font-medium text-foreground">{doctor}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium text-foreground">{date}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-muted-foreground">Time</span>
          <span className="font-medium text-foreground">{format12h(slot)}</span>
        </li>
      </ul>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          onClick={onAnother}
          variant="outline"
          className="h-10 rounded-lg border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Book another
        </Button>
      </div>
    </div>
  );
}
