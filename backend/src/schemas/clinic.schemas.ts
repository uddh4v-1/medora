import { z } from "zod";

export const updateClinicBodySchema = z.object({
  name:        z.string().trim().min(2).max(200).optional(),
  phone:       z.string().trim().min(4).max(32).optional(),
  address:     z.string().trim().max(500).optional(),
  city:        z.string().trim().max(100).optional(),
  state:       z.string().trim().max(100).optional(),
  pincode:     z.string().trim().max(20).optional(),
  specialties: z.array(z.string().trim().max(80)).max(20).optional(),
  description: z.string().trim().max(1000).optional(),
  logoUrl:     z.string().max(2000).optional().nullable(),
  brandColor:  z.string().max(20).optional().nullable(),
});
export type UpdateClinicBody = z.infer<typeof updateClinicBodySchema>;
