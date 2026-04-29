export type PatientResponse = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  age: number | null;
  gender: string | null;
  nextVisitDate: string | null;
  createdAt: string;
};

export type PatientDetailResponse = PatientResponse & {
  visits: Array<{
    id: string;
    title: string;
    reason: string;
    status: "waiting" | "in-progress" | "completed";
    startedAt: string;
    doctorName: string | null;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: string;
    doctorName: string | null;
  }>;
  prescriptions: Array<{
    id: string;
    number: string;
    date: string;
    diagnosis: string;
    notes: string | null;
    doctorName: string | null;
    items: Array<{
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      notes: string | null;
    }>;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    total: number;
    status: "paid" | "unpaid";
    discount: number | null;
    gst: number | null;
    issuedAt: string;
    doctorName: string | null;
    items: Array<{ id: string; label: string; amount: number }>;
  }>;
};
