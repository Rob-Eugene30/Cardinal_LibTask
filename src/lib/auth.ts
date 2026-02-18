import { apiGet, apiPost, clearToken, setToken } from "../api/http";

export type Role = "admin" | "staff";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user?: unknown;
};

export async function signIn(email: string, password: string) {
  const res = await apiPost<LoginResponse>("/auth/login", { email, password });
  if (!res?.access_token) throw new Error("Login failed: missing access token.");
  setToken(res.access_token);
  return res;
}

export function signOut() {
  clearToken();
}

// alias if older files import logout()
export function logout() {
  signOut();
}

export type MeResponse = {
  user_id: string | null;
  email: string | null;

  // Supabase-related fields (often "authenticated")
  app_role?: string | null;
  jwt_role?: string | null;

  // ✅ Your app role from DB (this is what we want)
  db_role: Role | null;
};

export async function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>("/me");
}

export async function getMyRole(): Promise<Role> {
  const me = await getMe();

  // ✅ Use db_role for app routing/authorization
  const role = me.db_role;

  if (!role) throw new Error("No app role found (db_role is missing).");
  return role;
}
