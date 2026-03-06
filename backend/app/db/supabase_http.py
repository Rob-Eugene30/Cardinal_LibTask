from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.errors import bad_request, http_error


def _base_url() -> str:
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    return settings.SUPABASE_URL.rstrip("/")


def _headers(*, apikey: str, bearer: str | None = None, extra: dict[str, str] | None = None) -> dict[str, str]:
    if not apikey:
        bad_request("Supabase API key is not configured.")

    headers: dict[str, str] = {
        "apikey": apikey,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if bearer:
        headers["Authorization"] = f"Bearer {bearer}"
    if extra:
        headers.update(extra)
    return headers


def _handle_error(resp: httpx.Response):
    try:
        payload = resp.json()
    except Exception:
        payload = {"message": resp.text}
    http_error(resp.status_code, "SUPABASE_API_ERROR", str(payload))


# ---------------------------------------------------------------------------
# User-scoped PostgREST helpers (uses ANON key + the user's access token)
# ---------------------------------------------------------------------------

def sb_get(path: str, *, user_jwt: str | None = None, params: dict | None = None) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.get(url, headers=_headers(apikey=settings.SUPABASE_ANON_KEY, bearer=user_jwt), params=params)
        if r.status_code >= 400:
            _handle_error(r)
        return r.json()


def sb_post(
    path: str,
    *,
    user_jwt: str | None = None,
    json: Any = None,
    params: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.post(
            url,
            headers=_headers(apikey=settings.SUPABASE_ANON_KEY, bearer=user_jwt, extra=extra_headers),
            json=json,
            params=params,
        )
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None


def sb_patch(
    path: str,
    *,
    user_jwt: str | None = None,
    json: Any = None,
    params: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.patch(
            url,
            headers=_headers(apikey=settings.SUPABASE_ANON_KEY, bearer=user_jwt, extra=extra_headers),
            json=json,
            params=params,
        )
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None


def sb_delete(
    path: str,
    *,
    user_jwt: str | None = None,
    params: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    url = _base_url() + path
    with httpx.Client(timeout=20) as client:
        r = client.delete(
            url,
            headers=_headers(apikey=settings.SUPABASE_ANON_KEY, bearer=user_jwt, extra=extra_headers),
            params=params,
        )
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None


# ---------------------------------------------------------------------------
# Admin helpers (service role key). Use for:
# - inviting/creating auth users
# - bypassing RLS safely on the server
# ---------------------------------------------------------------------------

def _require_service_key() -> str:
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        bad_request("SUPABASE_SERVICE_ROLE_KEY is not configured.")
    return settings.SUPABASE_SERVICE_ROLE_KEY


def sb_admin_get(path: str, *, params: dict | None = None) -> Any:
    url = _base_url() + path
    key = _require_service_key()
    with httpx.Client(timeout=20) as client:
        r = client.get(url, headers=_headers(apikey=key, bearer=key), params=params)
        if r.status_code >= 400:
            _handle_error(r)
        return r.json()


def sb_admin_post(
    path: str,
    *,
    json: Any = None,
    params: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    url = _base_url() + path
    key = _require_service_key()
    with httpx.Client(timeout=20) as client:
        r = client.post(
            url,
            headers=_headers(apikey=key, bearer=key, extra=extra_headers),
            json=json,
            params=params,
        )
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None


def sb_admin_patch(
    path: str,
    *,
    json: Any = None,
    params: dict | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    url = _base_url() + path
    key = _require_service_key()
    with httpx.Client(timeout=20) as client:
        r = client.patch(
            url,
            headers=_headers(apikey=key, bearer=key, extra=extra_headers),
            json=json,
            params=params,
        )
        if r.status_code >= 400:
            _handle_error(r)
        return r.json() if r.text else None