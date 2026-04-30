import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "@/utils/async-handler";
import {
  discoverClinics,
  getClinicBySlug,
  createPublicAppointment,
} from "@/services/discover.service";

export const discoverRouter = Router();

discoverRouter.get("/clinics", asyncHandler(async (req, res) => {
  const name      = typeof req.query.name      === "string" ? req.query.name.trim()      : undefined;
  const city      = typeof req.query.city      === "string" ? req.query.city.trim()      : undefined;
  const pincode   = typeof req.query.pincode   === "string" ? req.query.pincode.trim()   : undefined;
  const specialty = typeof req.query.specialty === "string" ? req.query.specialty.trim() : undefined;
  const lat       = typeof req.query.lat       === "string" ? parseFloat(req.query.lat)       : undefined;
  const lng       = typeof req.query.lng       === "string" ? parseFloat(req.query.lng)       : undefined;
  const radiusKm  = typeof req.query.radiusKm  === "string" ? parseFloat(req.query.radiusKm)  : undefined;

  const results = await discoverClinics({ name, city, pincode, specialty, lat, lng, radiusKm });
  res.json({ clinics: results });
}));

discoverRouter.get("/clinics/:slug", asyncHandler(async (req, res) => {
  const slug = String(req.params.slug);
  const clinic = await getClinicBySlug(slug);
  if (!clinic) {
    res.status(404).json({ error: "Clinic not found" });
    return;
  }
  res.json({ clinic });
}));

const PublicBookingBody = z.object({
  name:      z.string().min(1).max(200),
  phone:     z.string().min(1).max(24),
  reason:    z.string().max(500).optional(),
  doctorId:  z.string().nullable().optional(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/),
});

discoverRouter.post("/clinics/:slug/appointments", asyncHandler(async (req, res) => {
  const slug = String(req.params.slug);
  const parsed = PublicBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.flatten().fieldErrors });
    return;
  }

  const appointment = await createPublicAppointment(slug, parsed.data);
  if (!appointment) {
    res.status(404).json({ error: "Clinic not found or public booking disabled" });
    return;
  }

  res.status(201).json({ appointment });
}));
