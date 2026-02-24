// ✅ LOCAL TASK STORE (no backend / no database)
// Tasks are stored in localStorage and shared between Admin + Staff UIs.

import { getSession } from "../lib/auth";

export type Task = {
  id: string;
  code?: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assigned_to: string;
  created_by?: string;
  created_at?: string;
  status?: string | null;
};

export type TaskListOut = { items: Task[] };

const STORAGE_KEY = "clibtask_tasks_v1";

function readAll(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextCode(items: Task[]) {
  // TASK-001, TASK-002, ...
  const nums = items
    .map((t) => t.code)
    .filter(Boolean)
    .map((c) => String(c).match(/TASK-(\d+)/i)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return `TASK-${String(next).padStart(3, "0")}`;
}

export async function listTasks(): Promise<TaskListOut> {
  return { items: readAll() };
}

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  assigned_to: string;
  due_date?: string | null;
};

export async function createTask(payload: CreateTaskInput): Promise<Task> {
  const session = getSession();
  if (!session) throw new Error("Please login first.");

  const items = readAll();
  const now = new Date().toISOString();

  const task: Task = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    code: nextCode(items),
    title: payload.title,
    description: payload.description ?? null,
    assigned_to: payload.assigned_to,
    due_date: payload.due_date ?? null,
    created_by: session.user_id,
    created_at: now,
    status: "Not Yet Started",
  };

  writeAll([task, ...items]);
  return task;
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  const items = readAll();
  const idx = items.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error("Task not found.");
  const updated: Task = { ...items[idx], status };
  const next = [...items];
  next[idx] = updated;
  writeAll(next);
  return updated;
}
