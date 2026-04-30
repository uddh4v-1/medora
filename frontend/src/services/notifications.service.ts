import { apiGet, apiPost } from "./api";

export type BroadcastRecord = {
  id: string;
  audience: string;
  kind: string;
  title: string;
  body: string;
  recipientCount: number;
  sentAt: string;
};

export type PostBroadcastInput = {
  audience: string;
  kind: string;
  title: string;
  body: string;
  recipientCount: number;
  patientIds: string[];
};

export async function postBroadcast(input: PostBroadcastInput) {
  return apiPost<{ broadcast: BroadcastRecord }, PostBroadcastInput>(
    "/api/notifications/broadcast",
    input,
  );
}

export async function getBroadcasts() {
  return apiGet<{ broadcasts: BroadcastRecord[] }>("/api/notifications/broadcasts");
}
