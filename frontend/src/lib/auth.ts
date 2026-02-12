import { supabase } from "./supabase";

export type Role = "admin" | "staff";

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getMyRole(): Promise<Role> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not logged in (missing user id).");

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .single();

  if (error) throw error;

  const role = data?.role as Role | undefined;
  if (!role) throw new Error("Profile role is missing.");

  return role;
}
