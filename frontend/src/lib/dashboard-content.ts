import {
  AlertTriangle,
  BarChart2,
  CalendarDays,
  CreditCard,
  IndianRupee,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Megaphone,
  type LucideIcon,
  Pill,
  Settings,
  Users,
} from "lucide-react";

export type DashboardNavItem = {
  /** Key for `useI18n().t` — e.g. `nav.dashboard` */
  i18nKey: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: DashboardNavItem[] = [
  { i18nKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { i18nKey: "nav.queue", href: "/dashboard/queue", icon: ListOrdered },
  { i18nKey: "nav.calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { i18nKey: "nav.patients", href: "/dashboard/patients", icon: Users },
  {
    i18nKey: "nav.prescriptions",
    href: "/dashboard/prescriptions",
    icon: Pill,
  },
  { i18nKey: "nav.billing", href: "/dashboard/billing", icon: CreditCard },
  { i18nKey: "nav.revenue", href: "/dashboard/revenue", icon: LineChart },
  { i18nKey: "nav.reports", href: "/dashboard/reports", icon: BarChart2 },
  {
    i18nKey: "nav.notifications",
    href: "/dashboard/notifications",
    icon: Megaphone,
  },
  { i18nKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
];

export const currentClinic = {
  name: "Clinic 1",
  slug: "clinic-1",
  phone: "7777777777",
  address: "Pune",
  gst: "",
  email: "clinic@gmail.com",
};

export const currentUser = {
  name: "Uddhav Powar",
  shortName: "Uddhav",
  initials: "U",
  role: "Owner",
};

export type DashboardStat = {
  /** Stable id for list keys (labels may repeat across locales) */
  id: string;
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: "brand" | "coral" | "info" | "warning";
};

export const dashboardStats: DashboardStat[] = [
  {
    id: "seed-appts",
    label: "Today's appointments",
    value: "3",
    caption: "across all doctors",
    icon: CalendarDays,
    tone: "info",
  },
  {
    id: "seed-patients",
    label: "Total patients",
    value: "5",
    caption: "lifetime",
    icon: Users,
    tone: "brand",
  },
  {
    id: "seed-rev",
    label: "Revenue today",
    value: "₹0",
    caption: "—",
    icon: IndianRupee,
    tone: "coral",
  },
  {
    id: "seed-noshow",
    label: "No-shows (month)",
    value: "0",
    caption: "1 completed",
    icon: AlertTriangle,
    tone: "warning",
  },
];

export const aiInsight =
  "This week, the clinic has successfully completed one patient visit, showcasing the strength of patient engagement. However, the clinic is currently at risk of financial instability, as there has been no revenue generated for the month thus far. To improve this situation, I suggest implementing a reminder system for appointments to reduce the likelihood of missed visits and enhance overall revenue.";

export type RevenuePoint = {
  /** Short label for the chart axis */
  date: string;
  value: number;
  /** YYYY-MM-DD (local) for tooltips and matching */
  iso: string;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Sums **paid** invoice totals by `createdAt` for the last 7 local calendar days
 * (oldest → newest; last point is today).
 */
export function revenueFromPaidInvoicesLast7Days(
  invoices: Invoice[],
): RevenuePoint[] {
  const now = new Date();
  const days: { iso: string; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const iso = toIsoDate(d);
    const date = d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    days.push({ iso, date });
  }

  const totals = new Map<string, number>();
  for (const { iso } of days) {
    totals.set(iso, 0);
  }

  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    if (!inv.createdAt) continue;
    if (totals.has(inv.createdAt)) {
      totals.set(inv.createdAt, (totals.get(inv.createdAt) ?? 0) + inv.total);
    }
  }

  return days.map(({ iso, date }) => ({
    date,
    value: totals.get(iso) ?? 0,
    iso,
  }));
}

/**
 * Sums **paid** invoice `total` for calendar days in an inclusive **day-offset** range from today:
 * `0` = today, `1` = yesterday, … (matches `revenueFromPaidInvoicesLast7Days` date logic).
 */
export function sumPaidForDayOffsets(
  invoices: Invoice[],
  minOffset: number,
  maxOffset: number,
): number {
  const lo = Math.min(minOffset, maxOffset);
  const hi = Math.max(minOffset, maxOffset);
  let sum = 0;
  for (let off = lo; off <= hi; off++) {
    const d = new Date();
    d.setDate(d.getDate() - off);
    d.setHours(0, 0, 0, 0);
    const iso = toIsoDate(d);
    for (const inv of invoices) {
      if (inv.status !== "paid" || !inv.createdAt) continue;
      if (inv.createdAt === iso) {
        sum += inv.total;
      }
    }
  }
  return sum;
}

/**
 * The 7 days before the current rolling week (days 7–13 ago from today, inclusive).
 */
export function sumPaidPreviousSevenDays(invoices: Invoice[]) {
  return sumPaidForDayOffsets(invoices, 7, 13);
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export const appointmentStatuses: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
];

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  scheduled: "scheduled",
  confirmed: "confirmed",
  "in-progress": "in progress",
  completed: "completed",
  cancelled: "cancelled",
  "no-show": "no show",
};

export type Appointment = {
  id: string;
  patient: string;
  doctor: string;
  startTime: string; // "HH:MM" 24h
  endTime: string;
  reason: string;
  status: AppointmentStatus;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

export const doctors: Doctor[] = [
  { id: "doc-1", name: "Dr. Aarav Mehta", specialty: "General Physician" },
];

export type TeamRole = "Owner" | "Doctor" | "Receptionist";

export type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  specialty: string | null;
  fee: number | null;
};

export const teamMembers: TeamMember[] = [
  {
    id: "tm-1",
    name: "Uddhav Powar",
    role: "Owner",
    email: "clinic@gmail.com",
    specialty: null,
    fee: null,
  },
  {
    id: "tm-2",
    name: "Dr. Aarav Mehta",
    role: "Doctor",
    email: "doctor1.f41a69@clinic.demo",
    specialty: "General Physician",
    fee: 600,
  },
  {
    id: "tm-3",
    name: "Dr. Priya Sharma",
    role: "Doctor",
    email: "doctor2.f41a69@clinic.demo",
    specialty: "Pediatrician",
    fee: 800,
  },
  {
    id: "tm-4",
    name: "Riya Kapoor",
    role: "Receptionist",
    email: "reception.f41a69@clinic.demo",
    specialty: null,
    fee: null,
  },
];

export type Gender = "Male" | "Female";

export type VitalsEntry = {
  id: string;
  date: string;
  bp: string;
  weightKg: number | null;
  bloodSugar: number | null;
  pulse: number | null;
};

export type Attachment = {
  id: string;
  name: string;
  type: "lab" | "imaging" | "report" | "other";
  uploadedAt: string;
};

export type PatientNote = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
};

export type Patient = {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: Gender | null;
  /** Next scheduled visit (YYYY-MM-DD, local). Used for reminders & outreach. */
  nextVisitDate?: string | null;
  email?: string;
  address?: string;
  allergies?: string[];
  conditions?: string[];
  vitals?: VitalsEntry[];
  attachments?: Attachment[];
  notes?: PatientNote[];
};

export const patients: Patient[] = [
  {
    id: "p-1",
    name: "patient 2",
    phone: "999999999999",
    age: null,
    gender: null,
    nextVisitDate: null,
  },
  {
    id: "p-2",
    name: "Patient 1",
    phone: "222222222222",
    age: null,
    gender: null,
    nextVisitDate: "2026-05-10",
  },
  {
    id: "p-3",
    name: "Meera Nair",
    phone: "+919765432100",
    age: 67,
    gender: "Female",
    allergies: ["Penicillin"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    vitals: [
      { id: "vit-1", date: "2026-04-10", bp: "142/88", weightKg: 68, bloodSugar: 152, pulse: 84 },
      { id: "vit-2", date: "2026-04-17", bp: "138/86", weightKg: 67, bloodSugar: 144, pulse: 82 },
      { id: "vit-3", date: "2026-04-24", bp: "134/82", weightKg: 67, bloodSugar: 138, pulse: 78 },
    ],
    attachments: [
      { id: "att-1", name: "CBC report — Apr 10", type: "lab", uploadedAt: "2026-04-10" },
      { id: "att-2", name: "Knee X-ray", type: "imaging", uploadedAt: "2026-04-17" },
    ],
    notes: [
      { id: "note-1", body: "Patient reports knee pain after walking >15 min. Advised paracetamol and physiotherapy.", author: "Dr. Aarav Mehta", createdAt: "2026-04-17" },
    ],
    nextVisitDate: "2026-04-29",
  },
  {
    id: "p-4",
    name: "Vikram Singh",
    phone: "+919811001100",
    age: 45,
    gender: "Male",
    nextVisitDate: "2026-05-02",
  },
  {
    id: "p-5",
    name: "Sara Khan",
    phone: "+919900112233",
    age: 5,
    gender: "Female",
    allergies: ["Dust mites"],
    nextVisitDate: "2026-04-30",
  },
  {
    id: "p-6",
    name: "Rohan Iyer",
    phone: "+919812345678",
    age: 28,
    gender: "Male",
    nextVisitDate: "2026-06-15",
  },
  {
    id: "p-7",
    name: "Anjali Verma",
    phone: "+919876543210",
    age: 32,
    gender: "Female",
    nextVisitDate: "2026-04-28",
  },
];

export const todaysAppointments: Appointment[] = [
  {
    id: "apt-1",
    patient: "Anjali Verma",
    doctor: "Dr. Aarav Mehta",
    startTime: "14:30",
    endTime: "15:00",
    reason: "Routine check",
    status: "scheduled",
  },
  {
    id: "apt-2",
    patient: "Rohan Iyer",
    doctor: "Dr. Aarav Mehta",
    startTime: "15:30",
    endTime: "16:00",
    reason: "Routine check",
    status: "scheduled",
  },
  {
    id: "apt-3",
    patient: "Sara Khan",
    doctor: "Dr. Aarav Mehta",
    startTime: "16:30",
    endTime: "17:00",
    reason: "Routine check",
    status: "scheduled",
  },
  {
    id: "apt-4",
    patient: "Vikram Singh",
    doctor: "Dr. Aarav Mehta",
    startTime: "10:00",
    endTime: "10:30",
    reason: "Follow-up",
    status: "no-show",
  },
];

export type VisitStatus = "waiting" | "in-progress" | "completed";

export type Visit = {
  id: string;
  patient: string;
  doctor: string;
  title: string;
  reason: string;
  startedAt: string;
  status: VisitStatus;
};

export const visitStatuses: VisitStatus[] = [
  "waiting",
  "in-progress",
  "completed",
];

export const visitStatusLabel: Record<VisitStatus, string> = {
  waiting: "Waiting",
  "in-progress": "In progress",
  completed: "Completed",
};

export const visits: Visit[] = [
  {
    id: "v-1",
    patient: "Anjali Verma",
    doctor: "Dr. Aarav Mehta",
    title: "Visit",
    reason: "Routine check",
    startedAt: "2026-04-27T14:08:00",
    status: "waiting",
  },
  {
    id: "v-2",
    patient: "Rohan Iyer",
    doctor: "Dr. Aarav Mehta",
    title: "Follow-up",
    reason: "BP review",
    startedAt: "2026-04-27T13:30:00",
    status: "in-progress",
  },
  {
    id: "v-3",
    patient: "Sara Khan",
    doctor: "Dr. Aarav Mehta",
    title: "Visit",
    reason: "Cough & cold",
    startedAt: "2026-04-27T13:55:00",
    status: "waiting",
  },
  {
    id: "v-4",
    patient: "Meera Nair",
    doctor: "Dr. Aarav Mehta",
    title: "Initial consult",
    reason: "Knee pain",
    startedAt: "2026-04-27T11:00:00",
    status: "completed",
  },
];

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

export type Prescription = {
  id: string;
  number: string;
  patient: string;
  doctor: string;
  date: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
};

export const prescriptions: Prescription[] = [
  {
    id: "rx-1",
    number: "RX-00001",
    patient: "Anjali Verma",
    doctor: "Dr. Aarav Mehta",
    date: "2026-04-22",
    diagnosis: "Viral fever",
    medications: [
      {
        id: "m-1",
        name: "Paracetamol",
        dosage: "500mg",
        frequency: "1-0-1",
        duration: "3 days",
        notes: "After meals",
      },
      {
        id: "m-2",
        name: "Cetirizine",
        dosage: "10mg",
        frequency: "0-0-1",
        duration: "5 days",
        notes: "At bedtime",
      },
    ],
    notes: "Plenty of fluids, light meals.",
  },
];

export function nextPrescriptionNumber(existing: Prescription[]) {
  const highest = existing.reduce((max, rx) => {
    const n = Number.parseInt(rx.number.replace(/^RX-/, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `RX-${(highest + 1).toString().padStart(5, "0")}`;
}

export const frequencyOptions = [
  "1-0-0",
  "0-0-1",
  "1-0-1",
  "1-1-1",
  "SOS",
] as const;

export const durationOptions = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
] as const;

export type InvoiceStatus = "paid" | "unpaid";

export type InvoiceItem = {
  id: string;
  label: string;
  amount: number;
};

export type Invoice = {
  id: string;
  number: string;
  patient: string;
  total: number;
  status: InvoiceStatus;
  createdAt?: string;
  items?: InvoiceItem[];
  discount?: number;
  gst?: number;
  doctor?: string;
};

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-00001",
    patient: "Meera Nair",
    total: 600,
    status: "paid",
    createdAt: "2026-04-22",
    items: [{ id: "it-1", label: "Consultation", amount: 600 }],
    doctor: "Dr. Aarav Mehta",
  },
  {
    id: "inv-2",
    number: "INV-00002",
    patient: "Vikram Singh",
    total: 1200,
    status: "unpaid",
    createdAt: "2026-04-15",
    items: [
      { id: "it-2", label: "Consultation", amount: 600 },
      { id: "it-3", label: "Physiotherapy session", amount: 600 },
    ],
    doctor: "Dr. Aarav Mehta",
  },
  {
    id: "inv-3",
    number: "INV-00003",
    patient: "Anita Roy",
    total: 1500,
    status: "paid",
    createdAt: "2026-04-25",
    items: [{ id: "it-4", label: "Consultation + labs", amount: 1500 }],
    doctor: "Dr. Neha Sharma",
  },
  {
    id: "inv-4",
    number: "INV-00004",
    patient: "Rahul Khanna",
    total: 850,
    status: "paid",
    createdAt: "2026-04-27",
    items: [{ id: "it-5", label: "Follow-up", amount: 850 }],
    doctor: "Dr. Aarav Mehta",
  },
];

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function nextInvoiceNumber(existing: Invoice[]) {
  const highest = existing.reduce((max, inv) => {
    const n = Number.parseInt(inv.number.replace(/^INV-/, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `INV-${(highest + 1).toString().padStart(5, "0")}`;
}

export const calendarHours = Array.from({ length: 12 }, (_, i) => 8 + i);

export function generateCalendarSlots(slotMinutes: number): string[] {
  const out: string[] = [];
  const totalMinutes = (20 - 8) * 60;
  const startMinutes = 8 * 60;
  for (let offset = 0; offset < totalMinutes; offset += slotMinutes) {
    const total = startMinutes + offset;
    const h = Math.floor(total / 60);
    const m = total % 60;
    out.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }
  return out;
}

export function formatHour24(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function format12h(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
}

export function addMinutes(time: string, minutes: number) {
  const [hStr, mStr] = time.split(":");
  const total = Number(hStr) * 60 + Number(mStr) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function isSlotOccupied(slot: string, appointments: Appointment[]) {
  return appointments.some(
    (a) => slot >= a.startTime && slot < a.endTime,
  );
}

export function getAvailableSlots(appointments: Appointment[], slotMinutes = 30) {
  return generateCalendarSlots(slotMinutes).filter(
    (slot) => !isSlotOccupied(slot, appointments),
  );
}

export type NewAppointmentInput = {
  patient: string;
  doctor: string;
  reason: string;
  startTime: string;
  endTime: string;
};

export const lowInventory = [
  { id: "inv-pcm", name: "Paracetamol 500mg", remaining: 18, threshold: 50 },
  { id: "inv-cetirizine", name: "Cetirizine 10mg", remaining: 9, threshold: 30 },
];
