const API_PREFIX = "/api";
const TOKEN_KEY = "clt_access_token";

export type ApiError = {
  status: number;
  message: string;
  body?: unknown;
};

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
