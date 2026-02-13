import { apiGet, apiPost } from "./http";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assigned_to: string;
  created_by?: string;
  created_at?: string;
  status?: string | null;
};

export type TaskListOut = { items: Task[] };

export function listTasks() {
  return apiGet<TaskListOut>("/tasks");
}

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  assigned_to: string;
  due_date?: string | null;
};

export function createTask(payload: CreateTaskInput) {
  return apiPost<Task>("/tasks", payload);
}
