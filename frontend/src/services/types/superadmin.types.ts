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

// ── Onboarding ────────────────────────────────────────────────────────────────

export interface OnboardingStep { key: string; label: string; done: boolean }
export interface OnboardingItem {
  id: string; name: string; slug: string; status: ClinicStatus;
  createdAt: string; percent: number; steps: OnboardingStep[];
  plan: string; billingStatus: string;
}
export interface OnboardingResponse {
  total: number; page: number; limit: number; totalPages: number;
  needsNudge: number; items: OnboardingItem[];
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export interface BroadcastItem {
  id: string; subject: string; body: string; segment: string;
  recipientCount: number; sentBy: string | null;
  sentAt: string | null; scheduledAt: string | null; createdAt: string;
}
export interface BroadcastListResponse {
  total: number; page: number; limit: number; totalPages: number; items: BroadcastItem[];
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export interface TicketListItem {
  id: string; subject: string; status: string; priority: string;
  messageCount: number; createdAt: string; updatedAt: string;
  clinic: { id: string; name: string; slug: string };
}
export interface TicketListResponse {
  total: number; page: number; limit: number; totalPages: number; items: TicketListItem[];
}
export interface TicketMessage {
  id: string; body: string; isStaff: boolean; authorId: string | null; createdAt: string;
}
export interface TicketDetail {
  id: string; subject: string; status: string; priority: string;
  clinicId: string; createdAt: string; updatedAt: string;
  clinic: { id: string; name: string; slug: string };
  messages: TicketMessage[];
}

// ── SuperAdmin Accounts ───────────────────────────────────────────────────────

export interface SuperAdminAccount {
  id: string; name: string; email: string; status: string;
  emailVerified: boolean; createdAt: string;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentItem {
  id: string; amount: number; plan: string; status: string;
  description: string | null; periodStart: string | null; periodEnd: string | null;
  createdAt: string; clinic: { id: string; name: string; slug: string };
}
export interface PaymentListResponse {
  total: number; page: number; limit: number; totalPages: number; items: PaymentItem[];
}

// ── GDPR ──────────────────────────────────────────────────────────────────────

export interface DeletionRequestItem {
  id: string; reason: string | null; status: string; requestedBy: string | null;
  scheduledAt: string | null; completedAt: string | null;
  createdAt: string; updatedAt: string;
  clinic: { id: string; name: string; slug: string };
}
export interface DeletionRequestListResponse {
  total: number; page: number; limit: number; totalPages: number; items: DeletionRequestItem[];
}

// ── System Health ─────────────────────────────────────────────────────────────

export interface SystemHealth {
  db: { clinicCount: number; userCount: number; patientCount: number; appointmentCount: number; invoiceCount: number };
  activity: { last24h: number; last7d: number; errors24h: number; activeUsers24h: number };
  activityTrend: { date: string; count: number }[];
  uptime: number;
}

// ── API Usage ─────────────────────────────────────────────────────────────────

export interface ApiUsageItem {
  id: string; name: string; slug: string; status: ClinicStatus; requestsLast30d: number;
}
export interface ApiUsageResponse {
  total: number; page: number; limit: number; totalPages: number; items: ApiUsageItem[];
}

// ── Custom Plans ──────────────────────────────────────────────────────────────

export interface CustomPlan {
  id: string; name: string; description: string | null; price: number;
  maxPatients: number | null; maxUsers: number | null;
  features: Record<string, boolean>; isActive: boolean;
  createdAt: string; updatedAt: string;
}

// ── Financial Dashboard ───────────────────────────────────────────────────────

export interface RevenueByPlan {
  plan: string;
  count: number;
  mrr: number;
}

export interface MrrTrendPoint {
  month: string;
  newMrr: number;
  churnedMrr: number;
  netMrr: number;
}

export interface FinancialDashboard {
  mrr: number;
  arr: number;
  revenueByPlan: RevenueByPlan[];
  churnRate: number;
  mrrTrend: MrrTrendPoint[];
  forecast: {
    trialsExpiringSoon: number;
    conversionRate: number;
    projectedNewMrr: number;
  };
  summary: {
    activeCount: number;
    trialCount: number;
    cancelledCount: number;
    unpaidCount: number;
  };
}

// ── Clinic Health Scores ──────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";

export interface ClinicHealthItem {
  id: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  plan: string;
  billingStatus: string;
  trialEndsAt: string | null;
  score: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  activity: {
    appointmentsLast30: number;
    patientsLast30: number;
    invoicesLast30: number;
    lastActivityAt: string | null;
  };
}

export interface ClinicHealthResponse {
  total: number;
  totalAll: number;
  page: number;
  limit: number;
  totalPages: number;
  atRiskCount: number;
  avgScore: number;
  items: ClinicHealthItem[];
}
