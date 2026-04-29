export type ApiQueueStatus = "waiting" | "in-progress" | "completed";
export type ApiAppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export type DashboardOverviewResponse = {
  stats: {
    appointmentsToday: number;
    waitingCount: number;
    patientsTotal: number;
    unpaidCount: number;
  };
  nowServing: {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
    title: string;
    reason: string;
    status: ApiQueueStatus;
    startedAt: string;
  } | null;
  todaySchedule: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: ApiAppointmentStatus;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
  }>;
};

export type DashboardPatientsResponse = {
  items: Array<{
    id: string;
    name: string;
    phone: string;
    age: number | null;
    gender: string | null;
    nextVisitDate: string | null;
    createdAt: string;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardQueueResponse = {
  items: Array<{
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
    title: string;
    reason: string;
    status: ApiQueueStatus;
    startedAt: string;
  }>;
  counts: {
    waiting: number;
    inProgress: number;
    completed: number;
  };
};

export type DashboardInvoicesResponse = {
  items: Array<{
    id: string;
    number: string;
    total: number;
    status: "paid" | "unpaid";
    discount: number | null;
    gst: number | null;
    issuedAt: string;
    patientId: string;
    patientName: string;
    doctorId: string | null;
    doctorName: string | null;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
