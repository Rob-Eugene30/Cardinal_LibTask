export type StaffProfile = {
  id: string;
  full_name: string | null;
  role: "staff" | "admin";
};

const STAFF_KEY = "clt_local_users_v1";

const defaultUsers: StaffProfile[] = [
  { id: "admin-001", full_name: "Admin User", role: "admin" },
  { id: "staff-001", full_name: "Staff User", role: "staff" },
  { id: "staff-002", full_name: "Staff Two", role: "staff" },
];

function initUsers() {
  const existing = localStorage.getItem(STAFF_KEY);
  if (!existing) {
    localStorage.setItem(STAFF_KEY, JSON.stringify(defaultUsers));
  }
}

export async function getStaff(): Promise<StaffProfile[]> {
  initUsers();
  const raw = localStorage.getItem(STAFF_KEY);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StaffProfile[]) : [];
  } catch {
    return [];
  }
}
