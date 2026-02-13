const API_PREFIX = "/api";

// Keep your primary key
const PRIMARY_TOKEN_KEY = "clt_access_token";

// Common fallback keys (from older versions / experiments)
const FALLBACK_TOKEN_KEYS = ["access_token", "token"];

export type ApiError = {
  status: number;
  message: string;
  body?: unknown;
};

/**
 * Tries hard to find the access token:
 * 1) Our primary key: clt_access_token
 * 2) Legacy keys: access_token / token
 * 3) Supabase stored session key: sb-<project-ref>-auth-token (JSON)
 */
function getToken(): string | null {
  // 1) primary
  const primary = localStorage.getItem(PRIMARY_TOKEN_KEY);
  if (primary) return primary;

  // 2) fallbacks
  for (const k of FALLBACK_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }

  // 3) supabase session (if you ever used supabase-js in the frontend)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      // Different supabase-js versions may store token in slightly different shapes
      const token =
        parsed?.access_token ||
        parsed?.currentSession?.access_token ||
        parsed?.session?.access_token;

      if (typeof token === "string" && token.length > 0) return token;
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

export function setToken(token: string) {
  // Store in our primary key
  localStorage.setItem(PRIMARY_TOKEN_KEY, token);

  // Also store in a common key so older code paths still work
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem(PRIMARY_TOKEN_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Only set JSON header for non-empty body (and non-FormData)
  const body = init?.body;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const parsed = isJson
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");

  if (!res.ok) {
    // If unauthorized, clear token so the app forces re-login
    if (res.status === 401) clearToken();

    let message = `Request failed: ${res.status}`;

    if (typeof parsed === "string" && parsed) {
      message = parsed;
    } else if (parsed && typeof parsed === "object") {
      const detail = (parsed as any)?.detail;
      if (typeof detail === "string") message = detail;
      else if (detail?.error?.message) message = String(detail.error.message);
      else message = JSON.stringify(parsed);
    }

    const err: ApiError = { status: res.status, message, body: parsed };
    throw err;
  }

  return parsed as T;
}

export const apiGet = <T,>(path: string) => apiFetch<T>(path, { method: "GET" });

export const apiPost = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const apiPut = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const apiPatch = <T,>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T,>(path: string) => apiFetch<T>(path, { method: "DELETE" });
