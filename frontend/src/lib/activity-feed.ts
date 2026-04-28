import type { Appointment, Invoice, Prescription, Visit } from "./dashboard-content";

export type ActivityKind = "rx" | "invoice" | "visit" | "appointment";

export type ActivityEvent = {
  id: string;
  at: string;
  kind: ActivityKind;
  title: string;
  subtitle?: string;
  href: string;
};

function isoFromDateOnly(d: string) {
  return `${d}T12:00:00.000Z`;
}

export function buildActivityEvents(opts: {
  prescriptions: Prescription[];
  invoices: Invoice[];
  visits: Visit[];
  appointments: Appointment[];
}): ActivityEvent[] {
  const { prescriptions, invoices, visits, appointments } = opts;
  const today = new Date().toISOString().slice(0, 10);

  const out: ActivityEvent[] = [];

  for (const rx of prescriptions) {
    out.push({
      id: `rx-${rx.id}`,
      at: isoFromDateOnly(rx.date),
      kind: "rx",
      title: `Prescription ${rx.number}`,
      subtitle: rx.patient,
      href: "/dashboard/prescriptions",
    });
  }

  for (const inv of invoices) {
    const at = inv.createdAt
      ? `${inv.createdAt}T12:00:00.000Z`
      : `${today}T12:00:00.000Z`;
    out.push({
      id: `inv-${inv.id}`,
      at,
      kind: "invoice",
      title: inv.number,
      subtitle: `${inv.patient} · ${inv.status}`,
      href: "/dashboard/billing",
    });
  }

  for (const v of visits) {
    out.push({
      id: `visit-${v.id}`,
      at: v.startedAt,
      kind: "visit",
      title: `${v.patient} — ${visitStatusPhrase(v.status)}`,
      subtitle: v.doctor,
      href: "/dashboard/queue",
    });
  }

  for (const a of appointments) {
    out.push({
      id: `apt-${a.id}`,
      at: `${today}T${a.startTime}:00`,
      kind: "appointment",
      title: `Appointment — ${a.patient}`,
      subtitle: `${a.doctor} · ${a.startTime}`,
      href: "/dashboard/calendar",
    });
  }

  return out
    .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())
    .slice(0, 8);
}

function visitStatusPhrase(
  s: "waiting" | "in-progress" | "completed",
): string {
  if (s === "waiting") return "checked in (waiting)";
  if (s === "in-progress") return "in progress";
  return "visit completed";
}
