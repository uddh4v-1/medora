export type ClinicStatus = "active" | "suspended";

export interface ClinicListItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  status: ClinicStatus;
  createdAt: string;
  userCount: number;
  patientCount: number;
}

export interface ClinicListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: ClinicListItem[];
}

export interface ClinicDetailUser {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Doctor" | "Receptionist";
  emailVerified: boolean;
  createdAt: string;
}

export interface ClinicDetail {
  id: string;
  name: string;
  slug: string;
  phone: string;
  status: ClinicStatus;
  createdAt: string;
  updatedAt: string;
  patientCount: number;
  visitCount: number;
  appointmentCount: number;
  invoiceCount: number;
  users: ClinicDetailUser[];
}

export interface SetClinicStatusResponse {
  id: string;
  name: string;
  status: ClinicStatus;
}

// ── Users ────────────────────────────────────────────────────────────────────

export type UserStatus = "active" | "suspended";
export type UserRole = "Owner" | "Doctor" | "Receptionist";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  clinic: { id: string; name: string; slug: string } | null;
}

export interface UserListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: UserListItem[];
}

export interface SetUserStatusResponse {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
}

// ── Impersonation ─────────────────────────────────────────────────────────────

export interface ImpersonateClinicResponse {
  clinicName: string;
  ownerName: string;
  ownerEmail: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  clinicStats: { total: number; active: number; suspended: number };
  clinicRegistrations: { date: string; count: number }[];
  appointmentsByDay: { date: string; count: number }[];
  topClinicsByPatients: { id: string; name: string; slug: string; patientCount: number }[];
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export interface ClinicFlagItem {
  id: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  flags: { publicBooking: boolean; whatsappNotifications: boolean };
}

export interface ClinicFlagsListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: ClinicFlagItem[];
}

export interface PlatformConfigData {
  maintenanceMode: boolean;
  bannerMessage: string | null;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export type BillingStatus = "trial" | "active" | "unpaid" | "cancelled";
export type BillingPlan = "trial" | "starter" | "pro";

export interface BillingItem {
  id: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  createdAt: string;
  plan: string;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

export interface BillingListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: BillingItem[];
}
