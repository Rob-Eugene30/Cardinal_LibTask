import { getAccessToken } from "../lib/auth";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export function apiGet<T = any>(path: string) {
  return apiFetch(path, { method: "GET" }) as Promise<T>;
}
