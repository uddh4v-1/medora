import { Router } from "express";

import { postBroadcast, listBroadcasts } from "@/controllers/notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.post("/broadcast", postBroadcast);
notificationsRouter.get("/broadcasts", listBroadcasts);
