import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { getTeamMembers, postTeamMember, deleteTeamMember } from "@/controllers/team.controller";
import { requireRole } from "@/middleware/roles.middleware";

export const teamRouter = Router();

teamRouter.get("/", asyncHandler(getTeamMembers));
teamRouter.post("/", requireRole("Owner"), asyncHandler(postTeamMember));
teamRouter.delete("/:userId", requireRole("Owner"), asyncHandler(deleteTeamMember));
