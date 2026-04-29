"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  Appointment,
  Invoice,
  Patient,
  Visit,
} from "@/lib/dashboard-content";
import {
  getDashboardInvoices,
  getDashboardOverview,
  getDashboardPatients,
  getDashboardQueue,
} from "@/services/dashboard.service";
import { useClinicStore } from "@/stores/clinic-store";
import { getMe } from "@/services/auth.service";

type Props = { children: React.ReactNode };

/**
 * Validates **`GET /api/auth/me`** (JWT cookie) before showing the dashboard.
 * On success, refreshes **`signIn`** from the server user; on **401**, clears session and sends to **`/login`**.
 */
export function DashboardSessionSync({ children }: Props) {
  const router = useRouter();
  const signIn = useClinicStore((s) => s.signIn);
  const signOut = useClinicStore((s) => s.signOut);
  const hydrateDashboardData = useClinicStore((s) => s.hydrateDashboardData);
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

    function toVisits(rows: {
      id: string;
      patientName: string;
      doctorName: string | null;
      title: string;
      reason: string;
      status: "waiting" | "in-progress" | "completed";
      startedAt: string;
    }[]): Visit[] {
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

    function toAppointments(rows: {
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
    }[]): Appointment[] {
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

    function toInvoices(rows: {
      id: string;
      number: string;
      patientName: string;
      total: number;
      status: "paid" | "unpaid";
      issuedAt: string;
      discount: number | null;
      gst: number | null;
      doctorName: string | null;
    }[]): Invoice[] {
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
          signIn({
            email: data.user.email,
            role: data.user.role,
            signedInAt: new Date().toISOString(),
            userId: data.user.id,
            name: data.user.name ?? "",
            clinic: data.user.clinic ?? null,
          });

          const [overviewRes, patientsRes, queueRes, invoicesRes] =
            await Promise.all([
              getDashboardOverview(),
              getDashboardPatients({ page: 1, limit: 100 }),
              getDashboardQueue(),
              getDashboardInvoices({ page: 1, limit: 100 }),
            ]);

          if (!cancelled) {
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

            hydrateDashboardData({ patients, visits, appointments, invoices });
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
  }, [hydrateDashboardData, router, signIn, signOut]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
        <span aria-busy aria-live="polite">
          Signing you in…
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
