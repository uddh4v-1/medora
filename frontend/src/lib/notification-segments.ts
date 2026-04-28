import type { Patient } from "@/lib/dashboard-content";

export type NotificationAudience =
  | "this_week"
  | "closest_upcoming"
  | "all";

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/** Local calendar YYYY-MM-DD */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday 00:00:00 of the week containing `d` (ISO week: Monday start). */
export function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const x = new Date(d);
  x.setDate(d.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeekSunday(d: Date): Date {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function hasPhone(p: Patient) {
  return Boolean(p.phone?.trim());
}

/** Patients with `nextVisitDate` on or after today, soonest first. */
export function segmentClosestUpcoming(
  patients: Patient[],
  now: Date = new Date(),
): Patient[] {
  const today = toIsoDate(now);
  return patients
    .filter((p) => p.nextVisitDate && p.nextVisitDate >= today)
    .sort((a, b) =>
      (a.nextVisitDate ?? "").localeCompare(b.nextVisitDate ?? ""),
    );
}

/** Patients whose next visit falls Mon–Sun of the calendar week containing `now`. */
export function segmentThisWeek(
  patients: Patient[],
  now: Date = new Date(),
): Patient[] {
  const lo = toIsoDate(startOfWeekMonday(now));
  const hi = toIsoDate(endOfWeekSunday(now));
  return patients.filter((p) => {
    if (!p.nextVisitDate) return false;
    return p.nextVisitDate >= lo && p.nextVisitDate <= hi;
  });
}

/** Everyone with a mobile number — for festival / clinic-wide offers. */
export function segmentAllWithPhone(patients: Patient[]): Patient[] {
  return patients.filter(hasPhone);
}

export function segmentPatients(
  patients: Patient[],
  audience: NotificationAudience,
  now: Date = new Date(),
): Patient[] {
  switch (audience) {
    case "this_week":
      return segmentThisWeek(patients, now);
    case "closest_upcoming":
      return segmentClosestUpcoming(patients, now);
    case "all":
      return segmentAllWithPhone(patients);
    default:
      return [];
  }
}
