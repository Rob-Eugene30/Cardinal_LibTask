from __future__ import annotations

from typing import Any, Dict, Optional

import time
import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, jwk
from jose.exceptions import JWTError

from app.core.config import settings
from app.core.errors import bad_request, unauthorized

bearer = HTTPBearer(auto_error=False)

# Simple in-memory JWKS cache (fine for dev)
_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_FETCHED_AT: float | None = None
_JWKS_TTL_SECONDS = 60 * 10  # 10 minutes


def _jwks_url() -> str:
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    return settings.SUPABASE_URL.rstrip("/") + "/auth/v1/.well-known/jwks.json"


def _get_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _JWKS_CACHE, _JWKS_FETCHED_AT

    now = time.time()
    if (
        not force_refresh
        and _JWKS_CACHE is not None
        and _JWKS_FETCHED_AT is not None
        and (now - _JWKS_FETCHED_AT) < _JWKS_TTL_SECONDS
    ):
        return _JWKS_CACHE

    try:
        with httpx.Client(timeout=10) as client:
            r = client.get(_jwks_url())
            r.raise_for_status()
            _JWKS_CACHE = r.json()
            _JWKS_FETCHED_AT = now
            return _JWKS_CACHE
    except Exception:
        unauthorized("Unable to fetch JWKS.")


def _expected_issuer() -> str:
    if not settings.JWT_ISSUER:
        bad_request("JWT_ISSUER is not configured.")
    return settings.JWT_ISSUER


def _expected_audience() -> str:
    if not settings.JWT_AUDIENCE:
        bad_request("JWT_AUDIENCE is not configured.")
    return settings.JWT_AUDIENCE


def _select_jwk(jwks: dict[str, Any], kid: str) -> Optional[dict[str, Any]]:
    keys = jwks.get("keys", [])
    if not isinstance(keys, list):
        return None
    for k in keys:
        if isinstance(k, dict) and k.get("kid") == kid:
            return k
    return None


def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verify a Supabase JWT and return its claims.
    Uses JWKS and constructs a proper key object for ES256/RS256.
    """
    if not token:
        unauthorized("Missing Bearer token.")

    # Use the token's declared algorithm (most reliable)
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        unauthorized("Invalid token header.")

    kid = header.get("kid")
    if not kid:
        unauthorized("Token missing 'kid' header.")

    alg = (header.get("alg") or "").upper()
    if alg not in ("ES256", "RS256"):
        unauthorized(f"Unsupported JWT algorithm: {alg or 'unknown'}")

    jwks = _get_jwks()
    jwk_key = _select_jwk(jwks, kid)

    # If key rotated, refresh once
    if not jwk_key:
        jwks = _get_jwks(force_refresh=True)
        jwk_key = _select_jwk(jwks, kid)

    if not jwk_key:
        unauthorized("Signing key not found for token (kid mismatch).")

    # Construct key and decode using PEM
    try:
        key_obj = jwk.construct(jwk_key, algorithm=alg)
        public_pem = key_obj.to_pem().decode()

        claims = jwt.decode(
            token,
            public_pem,
            algorithms=[alg],
            issuer=_expected_issuer(),
            audience=_expected_audience(),
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )

        if not isinstance(claims, dict):
            unauthorized("Invalid token claims.")
        return claims
    except JWTError:
        unauthorized("Invalid or expired token.")
    except Exception:
        unauthorized("Token verification failed.")


def _extract_role_from_claims(claims: Dict[str, Any]) -> Optional[str]:
    user_meta = claims.get("user_metadata") or {}
    app_meta = claims.get("app_metadata") or {}

    for container in (user_meta, app_meta, claims):
        if isinstance(container, dict):
            role = container.get("app_role") or container.get("role")
            if isinstance(role, str) and role.strip():
                return role.strip().lower()
    return None


def _fetch_profile_role_via_rest(user_id: str, access_token: str) -> Optional[str]:
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    if not settings.SUPABASE_ANON_KEY:
        bad_request("SUPABASE_ANON_KEY is not configured.")

    url = settings.SUPABASE_URL.rstrip("/") + "/rest/v1/profiles"
    params = {"select": "role", "id": f"eq.{user_id}"}
    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=10) as client:
            r = client.get(url, headers=headers, params=params)
    except Exception:
        return None

    if r.status_code >= 400:
        return None

    try:
        rows = r.json()
        if isinstance(rows, list) and rows:
            role = rows[0].get("role")
            if isinstance(role, str) and role.strip():
                return role.strip().lower()
    except Exception:
        return None

    return None


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Dict[str, Any]:
    if not creds or not creds.credentials:
        unauthorized("Missing Bearer token.")

    token = creds.credentials
    claims = verify_supabase_jwt(token)

    user_id = claims.get("sub")
    if not user_id:
        unauthorized("Token missing subject (sub).")

    email = claims.get("email")

    jwt_role = _extract_role_from_claims(claims)
    db_role = _fetch_profile_role_via_rest(user_id=str(user_id), access_token=token)

    effective_role = jwt_role or db_role

    return {
        "user_id": str(user_id),
        "email": str(email) if email else None,
        "app_role": effective_role,
        "jwt_role": jwt_role,
        "db_role": db_role,
        "claims": claims,
        "access_token": token,
    }
