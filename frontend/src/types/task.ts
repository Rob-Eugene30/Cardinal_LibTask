export const TASK_STATUS_CODES = [
  "pending",
  "in_progress",
  "done",
  "on_hold",
  "cancelled",
] as const;

export type TaskStatusCode = (typeof TASK_STATUS_CODES)[number];
export type TaskStatusLabel =
  | "Not Yet Started"
  | "In Progress"
  | "Finished"
  | "On Hold"
  | "Abolished";

export const STATUS_LABEL_BY_CODE: Record<TaskStatusCode, TaskStatusLabel> = {
  pending: "Not Yet Started",
  in_progress: "In Progress",
  done: "Finished",
  on_hold: "On Hold",
  cancelled: "Abolished",
};

export const STATUS_CODE_BY_LABEL: Record<TaskStatusLabel, TaskStatusCode> = {
  "Not Yet Started": "pending",
  "In Progress": "in_progress",
  Finished: "done",
  "On Hold": "on_hold",
  Abolished: "cancelled",
};

export type TaskRecord = {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assigned_to: string;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  priority?: "Low" | "Medium" | "High" | string | null;
};

export function normalizeTaskStatus(input: string | null | undefined): TaskStatusCode {
  const raw = (input ?? "").toString().trim().toLowerCase();
  switch (raw) {
    case "pending":
    case "not yet started":
      return "pending";
    case "in_progress":
    case "in progress":
      return "in_progress";
    case "done":
    case "finished":
      return "done";
    case "on_hold":
    case "on hold":
    case "blocked":
      return "on_hold";
    case "cancelled":
    case "abolished":
      return "cancelled";
    default:
      return "pending";
  }
}

export function getTaskStatusLabel(input: string | null | undefined): TaskStatusLabel {
  return STATUS_LABEL_BY_CODE[normalizeTaskStatus(input)];
}

export function getTaskStatusClass(input: string | null | undefined): string {
  switch (normalizeTaskStatus(input)) {
    case "pending":
      return "status-not";
    case "in_progress":
      return "status-progress";
    case "done":
      return "status-finished";
    case "on_hold":
      return "status-hold";
    case "cancelled":
      return "status-hold";
    default:
      return "status-not";
  }
}

export function getTaskBadgeTone(input: string | null | undefined): string {
  switch (normalizeTaskStatus(input)) {
    case "pending":
      return "red";
    case "in_progress":
      return "yellow";
    case "done":
      return "green";
    case "on_hold":
    case "cancelled":
      return "gray";
    default:
      return "";
  }
}

export const TASK_STATUS_FILTER_OPTIONS: Array<{ value: TaskStatusCode | "All"; label: string }> = [
  { value: "All", label: "All Status" },
  { value: "pending", label: "Not Yet Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Finished" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Abolished" },
];