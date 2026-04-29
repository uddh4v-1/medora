export type CreateVisitResponse = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  title: string;
  reason: string;
  status: "waiting";
  startedAt: string;
};
