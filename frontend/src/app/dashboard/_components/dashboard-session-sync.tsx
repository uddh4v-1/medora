"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  Appointment,
  Invoice,
  Patient,
  Prescription,
  TeamMember,
  Visit,
} from "@/lib/dashboard-content";
import {
  getDashboardInvoices,
  getDashboardOverview,
  getDashboardPatients,
  getDashboardQueue,
} from "@/services/dashboard.service";
import { getPrescriptions } from "@/services/prescriptions.service";
import { getTeamMembers } from "@/services/team.service";
import { useClinicStore } from "@/stores/clinic-store";
import { getMe } from "@/services/auth.service";
import { getClinic } from "@/services/clinic.service";
import { DashboardSkeleton } from "./dashboard-skeleton";

type Props = { children: React.ReactNode };

export function DashboardSessionSync({ children }: Props) {
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const signOut = useClinicStore((s) => s.signOut);
  const hydrateDashboardData = useClinicStore((s) => s.hydrateDashboardData);
  const setClinicProfile = useClinicStore((s) => s.setClinicProfile);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function toGender(value: string | null): Patient["gender"] {
      if (!value) return null;
      const normalized = value.trim().toLowerCase();
      if (normalized === "male") return "Male";
      if (normalized === "female") return "Female";
      return null;
    }

    function toVisits(
      rows: {
        id: string;
        patientName: string;
        doctorName: string | null;
        title: string;
        reason: string;
        status: "waiting" | "in-progress" | "completed";
        startedAt: string;
      }[],
    ): Visit[] {
      return rows.map((v) => ({
        id: v.id,
        patient: v.patientName,
        doctor: v.doctorName ?? "Unassigned",
        title: v.title,
        reason: v.reason,
        status: v.status,
        startedAt: v.startedAt,
      }));
    }

    function toAppointments(
      rows: {
        id: string;
        patientName: string;
        doctorName: string | null;
        startTime: string;
        endTime: string;
        reason: string;
        status:
          | "scheduled"
          | "confirmed"
          | "in-progress"
          | "completed"
          | "cancelled"
          | "no-show";
      }[],
    ): Appointment[] {
      return rows.map((a) => ({
        id: a.id,
        patient: a.patientName,
        doctor: a.doctorName ?? "Unassigned",
        startTime: a.startTime,
        endTime: a.endTime,
        reason: a.reason,
        status: a.status,
      }));
    }

    function toInvoices(
      rows: {
        id: string;
        number: string;
        patientName: string;
        total: number;
        status: "paid" | "unpaid";
        issuedAt: string;
        discount: number | null;
        gst: number | null;
        doctorName: string | null;
      }[],
    ): Invoice[] {
      return rows.map((inv) => ({
        id: inv.id,
        number: inv.number,
        patient: inv.patientName,
        total: inv.total,
        status: inv.status,
        createdAt: inv.issuedAt.slice(0, 10),
        discount: inv.discount ?? undefined,
        gst: inv.gst ?? undefined,
        doctor: inv.doctorName ?? undefined,
      }));
    }

    function toPrescriptions(
      rows: {
        id: string;
        number: string;
        date: string;
        patientName: string;
        doctorName: string | null;
        diagnosis: string;
        notes: string | null;
        items: {
          id: string;
          name: string;
          dosage: string;
          frequency: string;
          duration: string;
          notes: string | null;
        }[];
      }[],
    ): Prescription[] {
      return rows.map((rx) => ({
        id: rx.id,
        number: rx.number,
        patient: rx.patientName,
        doctor: rx.doctorName ?? "Unassigned",
        date: rx.date,
        diagnosis: rx.diagnosis,
        notes: rx.notes ?? "",
        medications: rx.items.map((i) => ({
          id: i.id,
          name: i.name,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration,
          notes: i.notes ?? "",
        })),
      }));
    }

    function toTeamMembers(
      rows: {
        id: string;
        name: string;
        email: string;
        role: "Owner" | "Doctor" | "Receptionist";
        specialty: string | null;
        fee: number | null;
      }[],
    ): TeamMember[] {
      return rows.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        specialty: m.specialty,
        fee: m.fee,
      }));
    }

    async function validateSession() {
      try {
        const { ok, data, status } = await getMe();
        if (cancelled) return;

        if (
          ok &&
          data.user?.email &&
          data.user.role &&
          typeof data.user.id === "string"
        ) {
          // SuperAdmin has no clinic — send them to their own dashboard (unless impersonating a clinic)
          if (data.user.role === "SuperAdmin" && !data.user.isImpersonating) {
            router.replace("/superadmin");
            return;
          }

          signIn({
            email: data.user.email,
            role: data.user.role,
            signedInAt: new Date().toISOString(),
            userId: data.user.id,
            name: data.user.name ?? "",
            clinic: data.user.clinic ?? null,
            isImpersonating: data.user.isImpersonating ?? false,
          });

          const [overviewRes, patientsRes, queueRes, invoicesRes, rxRes, teamRes, clinicRes] =
            await Promise.all([
              getDashboardOverview(),
              getDashboardPatients({ page: 1, limit: 100 }),
              getDashboardQueue(),
              getDashboardInvoices({ page: 1, limit: 100 }),
              getPrescriptions({ page: 1, limit: 100 }),
              getTeamMembers(),
              getClinic(),
            ]);

          if (!cancelled) {
            if (clinicRes.ok) setClinicProfile(clinicRes.data);

            const patients: Patient[] = patientsRes.ok
              ? patientsRes.data.items.map((p) => ({
                  id: p.id,
                  name: p.name,
                  phone: p.phone,
                  age: p.age,
                  gender: toGender(p.gender),
                  nextVisitDate: p.nextVisitDate,
                }))
              : [];

            const visits: Visit[] = queueRes.ok ? toVisits(queueRes.data.items) : [];

            const appointments: Appointment[] = overviewRes.ok
              ? toAppointments(overviewRes.data.todaySchedule)
              : [];

            const invoices: Invoice[] = invoicesRes.ok
              ? toInvoices(invoicesRes.data.items)
              : [];

            const prescriptions: Prescription[] = rxRes.ok
              ? toPrescriptions(rxRes.data.items)
              : [];

            const teamMembers: TeamMember[] = teamRes.ok
              ? toTeamMembers(teamRes.data.items)
              : [];

            const overviewStats = overviewRes.ok
              ? overviewRes.data.stats
              : { appointmentsToday: 0, waitingCount: 0, patientsTotal: 0, unpaidCount: 0 };

            hydrateDashboardData({
              patients,
              visits,
              appointments,
              invoices,
              prescriptions,
              teamMembers,
              overviewStats,
            });
          }

          setReady(true);
          return;
        }

        if (status === 401 || status === 403) {
          signOut();
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    }

    validateSession();
    return () => {
      cancelled = true;
    };
  }, [hydrateDashboardData, router, signIn, signOut, setClinicProfile]);

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}
