import type { Appointment, Patient, Prescription } from "./dashboard-content";

export type MedicationCount = { name: string; count: number };

export type AgeBucket = "0–17" | "18–35" | "36–50" | "51+";

export type Demographics = {
  total: number;
  gender: { male: number; female: number; unknown: number };
  ageBuckets: Record<AgeBucket, number>;
};

export type DoctorUtil = { name: string; appointmentCount: number };

export type ReportsSnapshot = {
  topMedications: MedicationCount[];
  noShow: { count: number; total: number; ratePercent: number | null };
  doctorUtilization: DoctorUtil[];
  demographics: Demographics;
};

function normalizeMedName(name: string) {
  return name.trim();
}

function collectMedications(prescriptions: Prescription[]) {
  const map = new Map<string, number>();
  for (const rx of prescriptions) {
    for (const m of rx.medications) {
      const n = normalizeMedName(m.name);
      if (!n) continue;
      map.set(n, (map.get(n) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function demographics(patients: Patient[]): Demographics {
  const g = { male: 0, female: 0, unknown: 0 };
  const ageBuckets: Record<AgeBucket, number> = {
    "0–17": 0,
    "18–35": 0,
    "36–50": 0,
    "51+": 0,
  };
  for (const p of patients) {
    if (p.gender === "Male") g.male += 1;
    else if (p.gender === "Female") g.female += 1;
    else g.unknown += 1;
    if (p.age == null) continue;
    if (p.age <= 17) ageBuckets["0–17"] += 1;
    else if (p.age <= 35) ageBuckets["18–35"] += 1;
    else if (p.age <= 50) ageBuckets["36–50"] += 1;
    else ageBuckets["51+"] += 1;
  }
  return { total: patients.length, gender: g, ageBuckets };
}

function doctorUtil(appointments: Appointment[]): DoctorUtil[] {
  const map = new Map<string, number>();
  for (const a of appointments) {
    map.set(a.doctor, (map.get(a.doctor) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, appointmentCount]) => ({ name, appointmentCount }))
    .sort((a, b) => b.appointmentCount - a.appointmentCount);
}

export function buildReports(opts: {
  prescriptions: Prescription[];
  appointments: Appointment[];
  patients: Patient[];
}): ReportsSnapshot {
  const noShow = opts.appointments.filter((a) => a.status === "no-show");
  const total = opts.appointments.length;
  const ratePercent =
    total > 0
      ? Math.round((noShow.length / total) * 1000) / 10
      : null;

  return {
    topMedications: collectMedications(opts.prescriptions).slice(0, 8),
    noShow: { count: noShow.length, total, ratePercent },
    doctorUtilization: doctorUtil(opts.appointments),
    demographics: demographics(opts.patients),
  };
}
