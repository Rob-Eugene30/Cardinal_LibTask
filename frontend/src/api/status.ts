import { apiGet, apiPost } from "./http";

export type StatusUpdate = {
  id?: string;
  task_id: string;
  status: string;
  note?: string | null;
  updated_by?: string;
  created_at?: string;
};

export function listStatusUpdates(taskId: string) {
  return apiGet<{ items: StatusUpdate[] }>(`/status/${encodeURIComponent(taskId)}`);
}

export function addStatusUpdate(payload: { task_id: string; status: string; note?: string | null }) {
  return apiPost<StatusUpdate>("/status", payload);
}
