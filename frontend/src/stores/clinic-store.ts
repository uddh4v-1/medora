"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  type Appointment,
  type AppointmentStatus,
  type Invoice,
  invoices as seedInvoices,
  type Patient,
  patients as seedPatients,
  type Prescription,
  prescriptions as seedPrescriptions,
  type TeamMember,
  teamMembers as seedTeamMembers,
  todaysAppointments as seedAppointments,
  type Visit,
  visits as seedVisits,
  type VisitStatus,
} from "@/lib/dashboard-content";
import type { NotificationAudience } from "@/lib/notification-segments";
import type { ClinicSummary } from "@/services/types/auth.types";
import type { ClinicResponse } from "@/services/clinic.service";

export type Notification = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "success";
  createdAt: string;
  read: boolean;
};

export type Session = {
  email: string;
  role: "Owner" | "Doctor" | "Receptionist" | "SuperAdmin";
  signedInAt: string;
  /** From `/api/auth/*` — used when signed in via the API */
  userId?: string;
  name?: string;
  /** From `AuthUser.clinic` on login, register, and `GET /api/auth/me` */
  clinic?: ClinicSummary | null;
  isImpersonating?: boolean;
};

export type OutreachKind = "visit_reminder" | "festival_offer" | "custom";

/** Logged SMS / WhatsApp style broadcasts from the Notifications tab (demo UI). */
export type PatientBroadcastRecord = {
  id: string;
  audience: NotificationAudience;
  kind: OutreachKind;
  title: string;
  body: string;
  recipientCount: number;
  sentAt: string;
};

/** Pre-computed stats from the /dashboard/overview API. */
export type OverviewStats = {
  appointmentsToday: number;
  waitingCount: number;
  patientsTotal: number;
  unpaidCount: number;
};

type ClinicState = {
  session: Session | null;
  patients: Patient[];
  visits: Visit[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  notificationsRead: string[];
  broadcastHistory: PatientBroadcastRecord[];

  /** Accurate counts from the server overview — use these for stat cards. */
  overviewStats: OverviewStats | null;

  /** Full clinic profile from GET /api/clinic — superset of session.clinic. */
  clinicProfile: ClinicResponse | null;

  setClinicProfile: (profile: ClinicResponse) => void;
  updateClinicProfile: (patch: Partial<Pick<ClinicResponse, "name" | "phone">>) => void;

  signIn: (s: Session) => void;
  signOut: () => void;

  addPatient: (p: Patient) => void;
  updatePatient: (id: string, patch: Partial<Patient>) => void;

  addVisit: (v: Visit) => void;
  setVisitStatus: (id: string, status: VisitStatus) => void;

  addAppointment: (a: Appointment) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  addPrescription: (rx: Prescription) => void;

  addInvoice: (inv: Invoice) => void;
  markInvoicePaid: (id: string) => void;

  addTeamMember: (m: TeamMember) => void;
  removeTeamMember: (id: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;

  hydrateDashboardData: (payload: {
    patients: Patient[];
    visits: Visit[];
    appointments: Appointment[];
    invoices: Invoice[];
    prescriptions: Prescription[];
    teamMembers: TeamMember[];
    overviewStats: OverviewStats;
  }) => void;

  markNotificationsRead: (ids: string[]) => void;

  recordBroadcast: (payload: Omit<PatientBroadcastRecord, "id" | "sentAt">) =>
    void;

  resetAll: () => void;
};

const initialState = {
  session: null as Session | null,
  patients: seedPatients,
  visits: seedVisits,
  appointments: seedAppointments,
  prescriptions: seedPrescriptions,
  invoices: seedInvoices,
  teamMembers: seedTeamMembers,
  notificationsRead: [] as string[],
  broadcastHistory: [] as PatientBroadcastRecord[],
  overviewStats: null as OverviewStats | null,
  clinicProfile: null as ClinicResponse | null,
};

export const useClinicStore = create<ClinicState>()(
  persist(
    (set) => ({
      ...initialState,

      setClinicProfile: (profile) => set({ clinicProfile: profile }),
      updateClinicProfile: (patch) =>
        set((s) => ({
          clinicProfile: s.clinicProfile ? { ...s.clinicProfile, ...patch } : s.clinicProfile,
        })),

      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),

      addPatient: (p) =>
        set((s) => ({ patients: [p, ...s.patients] })),
      updatePatient: (id, patch) =>
        set((s) => ({
          patients: s.patients.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),

      addVisit: (v) => set((s) => ({ visits: [v, ...s.visits] })),
      setVisitStatus: (id, status) =>
        set((s) => ({
          visits: s.visits.map((v) => (v.id === id ? { ...v, status } : v)),
        })),

      addAppointment: (a) =>
        set((s) => ({ appointments: [a, ...s.appointments] })),
      setAppointmentStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),

      addPrescription: (rx) =>
        set((s) => ({ prescriptions: [rx, ...s.prescriptions] })),

      addInvoice: (inv) =>
        set((s) => ({ invoices: [inv, ...s.invoices] })),
      markInvoicePaid: (id) =>
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id ? { ...inv, status: "paid" } : inv,
          ),
        })),

      addTeamMember: (m) =>
        set((s) => ({ teamMembers: [...s.teamMembers, m] })),
      removeTeamMember: (id) =>
        set((s) => ({
          teamMembers: s.teamMembers.filter((m) => m.id !== id),
        })),
      setTeamMembers: (members) => set({ teamMembers: members }),

      hydrateDashboardData: (payload) =>
        set(() => ({
          patients: payload.patients,
          visits: payload.visits,
          appointments: payload.appointments,
          invoices: payload.invoices,
          prescriptions: payload.prescriptions,
          teamMembers: payload.teamMembers,
          overviewStats: payload.overviewStats,
        })),

      markNotificationsRead: (ids) =>
        set((s) => ({
          notificationsRead: Array.from(
            new Set([...s.notificationsRead, ...ids]),
          ),
        })),

      recordBroadcast: (payload) =>
        set((s) => ({
          broadcastHistory: [
            {
              ...payload,
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `bc-${Date.now()}`,
              sentAt: new Date().toISOString(),
            },
            ...s.broadcastHistory,
          ],
        })),

      resetAll: () => set(() => initialState),
    }),
    {
      name: "medora-clinic-store",
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        if (persisted === null || typeof persisted !== "object") {
          return persisted;
        }
        const s = persisted as Record<string, unknown>;
        if (version < 2) {
          return {
            ...s,
            broadcastHistory: Array.isArray(s.broadcastHistory)
              ? s.broadcastHistory
              : [],
          };
        }
        if (version < 4) {
          return { ...s, overviewStats: null };
        }
        if (version < 5) {
          return { ...s, clinicProfile: null };
        }
        if (version < 6) {
          return s;
        }
        return persisted;
      },
    },
  ),
);

export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useClinicStore.persist.onFinishHydration(cb),
    () => useClinicStore.persist.hasHydrated(),
    () => false,
  );
}
