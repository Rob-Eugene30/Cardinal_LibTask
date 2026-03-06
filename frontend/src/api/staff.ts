import { apiGet, apiPost } from "./http";

export type StaffProfile = {
  id: string;
  staff_code?: string | null;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  job_title?: string | null;
  availability?: "On Duty" | "Available" | "Leave" | string;
  employment_status?: "Active" | "Inactive" | string;
  employee_since?: string | null;
  role: "staff" | "admin";
};

export async function getStaff(): Promise<StaffProfile[]> {
  return apiGet<StaffProfile[]>("/staff");
}

export async function getStaffById(staffId: string): Promise<StaffProfile> {
  return apiGet<StaffProfile>(`/staff/${encodeURIComponent(staffId)}`);
}

export type InviteStaffInput = {
  staff_code: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  job_title?: string | null;
  availability?: "On Duty" | "Available" | "Leave";
  employment_status?: "Active" | "Inactive";
  employee_since?: string | null; // YYYY-MM-DD
};

export async function inviteStaff(payload: InviteStaffInput): Promise<StaffProfile> {
  return apiPost<StaffProfile>("/staff/invite", payload);
}