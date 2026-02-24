// ✅ LOCAL-ONLY AUTH (no backend / no database)
// This keeps your UI working while you build the real backend later.

import { clearToken, setToken } from "../api/http";

export type Role = "admin" | "staff";

export type LocalUser = {
  user_id: string;
  email: string;
  role: Role;
  password: string;
  full_name?: string;
};

// Demo accounts (edit as you like)
const USERS: LocalUser[] = [
  {
    user_id: "admin-001",
    email: "admin@mapua.edu.ph",
    password: "admin123",
    role: "admin",
    full_name: "Admin",
  },
  {
    user_id: "staff-001",
    email: "staff@mapua.edu.ph",
    password: "staff123",
    role: "staff",
    full_name: "Staff",
  },
];

const SESSION_KEY = "clt_local_session_v1";

export type LocalSession = {
  user_id: string;
  email: string;
  role: Role;
  full_name?: string;
  created_at: string;
};

export async function signIn(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const user = USERS.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  const session: LocalSession = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // keep token-based code paths happy (even though we won't call the API)
  setToken(`local-${user.role}-${user.user_id}`);

  return session;
}

export function getSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSession;
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  clearToken();
}

// alias if older files import logout()
export function logout() {
  signOut();
}

export async function getMyRole(): Promise<Role> {
  const session = getSession();
  if (!session?.role) throw new Error("Not logged in.");
  return session.role;
}
