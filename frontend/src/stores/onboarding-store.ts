"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// The wizard is built UI-first: every step writes to this store and navigates
// to the next route. When the backend `/api/onboarding/*` endpoints land, the
// `set*` actions become the place to call them — the screens themselves don't
// have to change.

export type OnboardingStep =
  | "signup"
  | "verify-email"
  | "profile"
  | "team"
  | "services"
  | "review"
  | "done";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "signup",
  "verify-email",
  "profile",
  "team",
  "services",
  "review",
  "done",
];

// The 2 wizard "stops" between signup and done — these are what the stepper
// dots represent. Signup is its own page (pre-wizard) and done is the
// celebration page.
export const WIZARD_STEPS: OnboardingStep[] = [
  "profile",
  "team",
];

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEK_DAYS: WeekDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABEL: Record<WeekDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type DayHours = { open: string; close: string } | null;
export type WorkingHours = Record<WeekDay, DayHours>;

export type Invitee = {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "RECEPTIONIST";
  specialty?: string;
  fee?: number;
};

export type DoctorService = {
  doctorId: string;
  doctorName: string;
  fee: number;
  specialty: string;
  useClinicHours: boolean;
  customHours: WorkingHours;
  slotMinutes: number;
};

export type SignupData = {
  ownerName: string;
  ownerEmail: string;
  clinicName: string;
  clinicPhone: string;
  slug: string;
};

export type ProfileData = {
  logoDataUrl: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  specialties: string[];
  description: string;
  gst: string;
  timezone: string;
  workingHours: WorkingHours;
  slotMinutes: number;
};

export type TeamData = {
  teamMode: "solo" | "team";
  invitees: Invitee[];
};

export type ServicesData = {
  doctorServices: DoctorService[];
};

const DEFAULT_HOURS: WorkingHours = {
  mon: { open: "09:00", close: "18:00" },
  tue: { open: "09:00", close: "18:00" },
  wed: { open: "09:00", close: "18:00" },
  thu: { open: "09:00", close: "18:00" },
  fri: { open: "09:00", close: "18:00" },
  sat: { open: "10:00", close: "14:00" },
  sun: null,
};

type OnboardingState = {
  // Step 1 — signup
  ownerName: string;
  ownerEmail: string;
  clinicName: string;
  clinicPhone: string;
  slug: string;

  // Step 2 — email verification
  emailVerified: boolean;

  // Step 3 — clinic profile
  logoDataUrl: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  specialties: string[];
  description: string;
  gst: string;
  timezone: string;
  workingHours: WorkingHours;
  slotMinutes: number;

  // Step 4 — team
  teamMode: "solo" | "team";
  invitees: Invitee[];

  // Step 5 — per-doctor services
  doctorServices: DoctorService[];

  // Furthest step the user has unlocked. Used by the stepper to mark "done".
  furthestStep: OnboardingStep;
  publishedAt: string | null;

  setSignup: (data: SignupData) => void;
  verifyEmail: () => void;
  setProfile: (data: ProfileData) => void;
  setTeam: (data: TeamData) => void;
  setServices: (data: ServicesData) => void;
  publish: () => void;
  markStepReached: (step: OnboardingStep) => void;
  reset: () => void;
};

const initialState = {
  ownerName: "",
  ownerEmail: "",
  clinicName: "",
  clinicPhone: "",
  slug: "",
  emailVerified: false,
  logoDataUrl: null as string | null,
  address: "",
  city: "",
  state: "",
  pincode: "",
  specialties: [] as string[],
  description: "",
  gst: "",
  timezone: "Asia/Kolkata",
  workingHours: DEFAULT_HOURS,
  slotMinutes: 30,
  teamMode: "solo" as "solo" | "team",
  invitees: [] as Invitee[],
  doctorServices: [] as DoctorService[],
  furthestStep: "signup" as OnboardingStep,
  publishedAt: null as string | null,
};

export function deriveSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function maxStep(a: OnboardingStep, b: OnboardingStep): OnboardingStep {
  return ONBOARDING_STEPS.indexOf(a) >= ONBOARDING_STEPS.indexOf(b) ? a : b;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSignup: (data) =>
        set((s) => ({
          ...data,
          furthestStep: maxStep(s.furthestStep, "profile"),
        })),

      verifyEmail: () =>
        set((s) => ({
          emailVerified: true,
          furthestStep: maxStep(s.furthestStep, "profile"),
        })),

      setProfile: (data) =>
        set((s) => ({
          ...data,
          furthestStep: maxStep(s.furthestStep, "team"),
        })),

      setTeam: (data) => {
        const { ownerName } = get();
        // Keep `doctorServices` in sync with the doctor list — owner + invited
        // doctors. Receptionists are excluded.
        const doctors: { id: string; name: string }[] = [
          { id: "self", name: ownerName || "You" },
          ...data.invitees
            .filter((i) => i.role === "DOCTOR")
            .map((i) => ({ id: i.id, name: i.name || i.email })),
        ];
        const existing = new Map(
          get().doctorServices.map((d) => [d.doctorId, d]),
        );
        const next: DoctorService[] = doctors.map((d) => {
          const prev = existing.get(d.id);
          if (prev) return { ...prev, doctorName: d.name };
          return {
            doctorId: d.id,
            doctorName: d.name,
            fee: 500,
            specialty: "General Medicine",
            useClinicHours: true,
            customHours: get().workingHours,
            slotMinutes: get().slotMinutes,
          };
        });
        set((s) => ({
          ...data,
          doctorServices: next,
          furthestStep: maxStep(s.furthestStep, "done"),
        }));
      },

      setServices: (data) =>
        set((s) => ({
          ...data,
          furthestStep: maxStep(s.furthestStep, "review"),
        })),

      publish: () =>
        set((s) => ({
          publishedAt: new Date().toISOString(),
          furthestStep: maxStep(s.furthestStep, "done"),
        })),

      markStepReached: (step) =>
        set((s) => ({ furthestStep: maxStep(s.furthestStep, step) })),

      reset: () => set(() => initialState),
    }),
    {
      name: "medora-onboarding",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Pages call this to wait for localStorage rehydration before reading
// values, so they don't flash empty state on first paint. We use
// `useSyncExternalStore` (rather than the `useState` + `useEffect` pattern)
// so the React 19 `react-hooks/set-state-in-effect` rule is happy.
export function useOnboardingHydrated() {
  return useSyncExternalStore(
    (cb) => useOnboardingStore.persist.onFinishHydration(cb),
    () => useOnboardingStore.persist.hasHydrated(),
    () => false,
  );
}
