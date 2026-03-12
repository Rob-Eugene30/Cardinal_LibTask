export type AppRole = "admin" | "staff";

export type StaffProfileRecord = {
  id: string;
  staff_code?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  job_title?: string | null;
  availability?: string | null;
  employment_status?: string | null;
  employee_since?: string | null;
  role: AppRole;
  created_at?: string | null;
  updated_at?: string | null;
};
