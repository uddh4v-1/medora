export type PrescriptionItem = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
};

export type PrescriptionRow = {
  id: string;
  number: string;
  date: string;
  diagnosis: string;
  notes: string | null;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  items: PrescriptionItem[];
};

export type PrescriptionsListResponse = {
  items: PrescriptionRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CreatePrescriptionResponse = PrescriptionRow;
