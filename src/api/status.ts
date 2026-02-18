import { apiGet, apiPost } from "./http";

export type StatusUpdate = {
  id?: number;
  task_id: string;
  status: string;
  note?: string | null;
  updated_by?: string;
  created_at?: string;
};

export function listStatusUpdates(taskId: number | string) {
  return apiGet<{ items: StatusUpdate[] }>(`/status/${taskId}`);
}

// Note: backend currently restricts status updates to admin only.
export function addStatusUpdate(payload: { task_id: string; status: string; note?: string | null }) {
  return apiPost<StatusUpdate>("/status", payload);
}
