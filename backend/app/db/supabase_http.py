from __future__ import annotations
from typing import Any, Optional
import httpx

from app.core.config import settings
from app.core.errors import bad_request, http_error


def _base_url() -> str:
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    return settings.SUPABASE_URL.rstrip("/")


def _headers(user_jwt: Optional[str] = None) -> dict[str, str]:
    if not settings.SUPABASE_ANON_KEY:
        bad_request("SUPABASE_ANON_KEY is not configured.")

    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,  # app identity :contentReference[oaicite:5]{index=5}
        "Content-Type": "application/json",
    }
    # IMPORTANT: Authorization should be USER JWT, not anon/service keys :contentReference[oaicite:6]{index=6}
    if user_jwt:
        headers["Authorization"] = f"Bearer {user_jwt}"
    return headers


def _handle_error(resp: httpx.Response):
    try:
        payload = resp.json()
    except Exception:
        payload = {"message": resp.text}
    http_error(resp.status_code, "SUPABASE_API_ERROR", str(payload))


def sb_get(path: str, user_jwt: str | None = None, params: dict | None = None) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.get(url, headers=_headers(user_jwt), params=params)
        if r.status_code >= 400:
            _handle_error(r)
        return r.json()


def sb_post(path: str, user_jwt: str | None = None, json: Any = None, params: dict | None = None) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.post(url, headers=_headers(user_jwt), json=json, params=params)
        if r.status_code >= 400:
            _handle_error(r)
        # PostgREST may return [] if you don't request representation
        return r.json() if r.text else None


def sb_patch(path: str, user_jwt: str | None = None, json: Any = None, params: dict | None = None) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.patch(url, headers=_headers(user_jwt), json=json, params=params)
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None


def sb_delete(path: str, user_jwt: str | None = None, params: dict | None = None) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.delete(url, headers=_headers(user_jwt), params=params)
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None
