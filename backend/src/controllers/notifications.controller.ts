import { z } from "zod";

import { asyncHandler } from "@/utils/async-handler";
import { HttpError } from "@/utils/http-error";
import { saveBroadcast, getBroadcasts } from "@/services/notifications.service";

const BroadcastBody = z.object({
  audience:       z.string().min(1).max(32),
  kind:           z.string().min(1).max(32),
  title:          z.string().min(1),
  body:           z.string().min(1),
  recipientCount: z.number().int().min(0),
});

export const postBroadcast = asyncHandler(async (req, res) => {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(403, "No clinic associated with this account");

  const parsed = BroadcastBody.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid body");
  }

  const broadcast = await saveBroadcast({
    clinicId,
    userId: req.auth?.userId,
    ...parsed.data,
  });

  res.status(201).json({ broadcast });
});

export const listBroadcasts = asyncHandler(async (req, res) => {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(403, "No clinic associated with this account");

  const broadcasts = await getBroadcasts(clinicId);
  res.json({ broadcasts });
});
