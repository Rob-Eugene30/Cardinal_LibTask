// Auth is now backed by the FastAPI backend + Supabase Auth.
// The UI does not change; we only replace the local-only mock implementation.

import { apiGet, apiPost, clearToken, setToken } from "../api/http";

export type Role = "admin" | "staff";

export type Session = {
  user_id: string;
  email: string;
  role: Role;
  created_at: string;
};

const SESSION_KEY = "clt_session_v2";

type LoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user?: any;
};

type MeResponse = {
  user_id: string;
  email: string | null;
  app_role: string | null;
  db_role: string | null;
};

function normalizeRole(r: any): Role {
  const v = (r ?? "").toString().trim().toLowerCase();
  return v === "admin" ? "admin" : "staff";
}

export async function signIn(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 1) Login through backend -> Supabase Auth
  const login = await apiPost<LoginResponse>("/auth/login", {
    email: cleanEmail,
    password,
  });

  if (!login?.access_token) throw new Error("Login failed.");

  // 2) Store bearer token for all subsequent /api requests
  setToken(login.access_token);

  // 3) Resolve role via backend (/api/me)
  const me = await apiGet<MeResponse>("/me");
  const role = normalizeRole(me.db_role || me.app_role);

  const session: Session = {
    user_id: me.user_id,
    email: me.email || cleanEmail,
    role,
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
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