import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const createAppointmentBodySchema = z.object({
  patientId: z.string().trim().min(1),
  doctorId: z.string().trim().min(1).optional().nullable(),
  date: z.string().regex(isoDateRegex, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(timeRegex, "startTime must be HH:MM"),
  endTime: z.string().regex(timeRegex, "endTime must be HH:MM"),
  reason: z.string().trim().min(1).max(500),
});
export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;

export const appointmentsQuerySchema = z.object({
  date: z.string().regex(isoDateRegex, "date must be YYYY-MM-DD").optional(),
  from: z.string().regex(isoDateRegex, "from must be YYYY-MM-DD").optional(),
  to: z.string().regex(isoDateRegex, "to must be YYYY-MM-DD").optional(),
  patientId: z.string().trim().min(1).optional(),
});
export type AppointmentsQuery = z.infer<typeof appointmentsQuerySchema>;

export const appointmentIdParamSchema = z.object({
  appointmentId: z.string().trim().min(1),
});

export const updateAppointmentStatusBodySchema = z.object({
  status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"]),
});
export type UpdateAppointmentStatusBody = z.infer<typeof updateAppointmentStatusBodySchema>;
