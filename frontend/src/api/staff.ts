import { apiDelete, apiGet, apiPatch, apiPost } from "./http";
import type { StaffProfileRecord } from "../types/user";

export type StaffProfile = StaffProfileRecord;

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
  employee_since?: string | null;
};

export type UpdateStaffInput = Partial<Omit<InviteStaffInput, "email">>;

export async function inviteStaff(payload: InviteStaffInput): Promise<StaffProfile> {
  return apiPost<StaffProfile>("/staff/invite", payload);
}

export async function updateStaff(staffId: string, payload: UpdateStaffInput): Promise<StaffProfile> {
  return apiPatch<StaffProfile>(`/staff/${encodeURIComponent(staffId)}`, payload);
}

export async function deleteStaff(staffId: string) {
  return apiDelete<{ deleted: boolean; staff_id: string }>(`/staff/${encodeURIComponent(staffId)}`);
}
