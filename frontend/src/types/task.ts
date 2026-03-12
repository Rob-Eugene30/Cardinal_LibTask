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