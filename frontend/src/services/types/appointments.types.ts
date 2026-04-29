export type AppointmentItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
};

export type AppointmentsListResponse = {
  items: AppointmentItem[];
};

export type CreateAppointmentResponse = AppointmentItem;
