import { apiGet, apiPost } from "./http";

export type Task = {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  priority?: "Low" | "Medium" | "High" | string;
  due_date?: string | null;
  assigned_to: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  status?: string | null;
};

export type TaskListOut = { items: Task[] };

export async function listTasks(): Promise<TaskListOut> {
  return apiGet<TaskListOut>("/tasks");
}

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  assigned_to: string;
  due_date?: string | null;
  priority?: "Low" | "Medium" | "High";
};

export async function createTask(payload: CreateTaskInput): Promise<Task> {
  return apiPost<Task>("/tasks", payload);
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  // Update status + record history (backend enforces who can do this)
  await apiPost("/status", { task_id: taskId, status });
  return apiGet<Task>(`/tasks/${encodeURIComponent(taskId)}`);
}