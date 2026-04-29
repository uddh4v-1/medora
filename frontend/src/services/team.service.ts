import { apiGet, apiPost, apiDelete } from "./api";
import type { TeamListResponse, TeamMemberRow } from "./types/team.types";

const BASE = "/api/team";

export type CreateTeamMemberInput = {
  name: string;
  email: string;
  password: string;
  role: "Doctor" | "Receptionist";
  specialty?: string;
  fee?: number | null;
};

export async function getTeamMembers() {
  return apiGet<TeamListResponse>(BASE);
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  return apiPost<TeamMemberRow, CreateTeamMemberInput>(BASE, input);
}

export async function deleteTeamMember(userId: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/${userId}`);
}
