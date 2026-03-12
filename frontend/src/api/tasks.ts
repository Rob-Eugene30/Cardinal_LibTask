import { apiGet, apiPatch, apiPost, apiPut } from "./http";
import type { TaskRecord } from "../types/task";

export type Task = TaskRecord & {
  code?: string | null;
  priority?: "Low" | "Medium" | "High" | string;
};

export type TaskListOut = { items: Task[] };

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  assigned_to: string;
  due_date?: string | null;
};

export type UpdateTaskInput = Partial<Pick<Task, "title" | "description" | "assigned_to" | "status">> & {
  due_date?: string | null;
};

export async function listTasks(): Promise<TaskListOut> {
  return apiGet<TaskListOut>("/tasks");
}

export async function getTask(taskId: string): Promise<Task> {
  return apiGet<Task>(`/tasks/${encodeURIComponent(taskId)}`);
}

export async function createTask(payload: CreateTaskInput): Promise<Task> {
  return apiPost<Task>("/tasks", payload);
}

export async function patchTask(taskId: string, payload: UpdateTaskInput): Promise<Task> {
  return apiPatch<Task>(`/tasks/${encodeURIComponent(taskId)}`, payload);
}

export async function setTaskTags(taskId: string, tagIds: string[]) {
  return apiPut<{ ok: boolean; task_id: string; tag_ids: string[] }>(`/tasks/${encodeURIComponent(taskId)}/tags`, {
    tag_ids: tagIds,
  });
}

export async function updateTaskStatus(taskId: string, status: string, note?: string | null): Promise<Task> {
  await apiPost("/status", { task_id: taskId, status, note: note ?? null });
  return getTask(taskId);
}
