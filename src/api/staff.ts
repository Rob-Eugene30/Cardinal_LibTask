import { apiGet } from "./http";

export type StaffProfile = {
  id: string;
  full_name: string | null;
  role: "staff" | "admin";
  created_at?: string;
  updated_at?: string;
};

export function getStaff() {
  return apiGet<StaffProfile[]>("/staff");
}
