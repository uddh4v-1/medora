import { apiPost } from "./api";
import type { CreateVisitResponse } from "./types/visits.types";

const BASE = "/api/visits";

export type CreateVisitInput = {
  patientId: string;
  doctorId?: string | null;
  title?: string;
  reason: string;
};

export async function createVisit(input: CreateVisitInput) {
  return apiPost<CreateVisitResponse, CreateVisitInput>(BASE, input);
}
