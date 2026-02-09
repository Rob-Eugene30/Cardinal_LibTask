from __future__ import annotations

from typing import Any, Dict, Optional

import time
import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import settings
from app.core.errors import unauthorized, bad_request

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
    """
    Fetch Supabase JWKS (public keys) for asymmetric JWT verification (ES256/RS256).
    Cached in memory with a short TTL.
    """
    global _JWKS_CACHE, _JWKS_FETCHED_AT

    now = time.time()
    if (
        not force_refresh
        and _JWKS_CACHE is not None
        and _JWKS_FETCHED_AT is not None
        and (now - _JWKS_FETCHED_AT) < _JWKS_TTL_SECONDS
    ):
        return _JWKS_CACHE

    url = _jwks_url()
    with httpx.Client(timeout=10) as client:
        r = client.get(url)
        r.raise_for_status()
        _JWKS_CACHE = r.json()
        _JWKS_FETCHED_AT = now
        return _JWKS_CACHE


def _expected_issuer() -> str:
    # Supabase access tokens typically use: https://<ref>.supabase.co/auth/v1
    if not settings.JWT_ISSUER:
        bad_request("JWT_ISSUER is not configured.")
    return settings.JWT_ISSUER


def _expected_audience() -> str:
    # Usually: "authenticated"
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

    Supports modern Supabase asymmetric JWT signing (ES256 / RS256) via JWKS.
    Validates:
      - signature (using JWKS key by kid)
      - issuer (iss)
      - audience (aud)
      - exp (expiry)

    IMPORTANT:
      Set in .env:
        SUPABASE_URL=https://<ref>.supabase.co
        SUPABASE_JWT_ALG=ES256   (your project uses ES256)
        JWT_ISSUER=https://<ref>.supabase.co/auth/v1
        JWT_AUDIENCE=authenticated
    """
    if not token:
        unauthorized("Missing Bearer token.")

    alg = (settings.SUPABASE_JWT_ALG or "ES256").upper()
    if alg not in ("ES256", "RS256"):
        unauthorized(f"Unsupported JWT algorithm: {alg}")

    # Get header (kid) so we can pick the right JWKS key
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        unauthorized("Invalid token header.")

    kid = header.get("kid")
    if not kid:
        unauthorized("Token missing 'kid' header.")

    # Fetch JWKS and select key
    jwks = _get_jwks()
    jwk_key = _select_jwk(jwks, kid)

    # If key rotated, refresh once
    if not jwk_key:
        jwks = _get_jwks(force_refresh=True)
        jwk_key = _select_jwk(jwks, kid)

    if not jwk_key:
        unauthorized("Signing key not found for token (kid mismatch).")

    # Decode & verify (jose handles signature + exp + issuer + audience)
    try:
        claims = jwt.decode(
            token,
            jwk_key,
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


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Dict[str, Any]:
    """
    Dependency: extracts Bearer token, verifies it, and returns a user dict.

    Returns:
      {
        "sub": <user_id>,
        "email": ...,
        "app_role": "admin"|"staff"|None,
        "claims": <full claims>,
        "access_token": <raw token>
      }
    """
    if not creds or not creds.credentials:
        unauthorized("Missing Bearer token.")

    token = creds.credentials
    claims = verify_supabase_jwt(token)

    # Role can be in user_metadata or app_metadata depending on setup.
    app_role = None
    user_meta = claims.get("user_metadata") or {}
    app_meta = claims.get("app_metadata") or {}

    if isinstance(user_meta, dict):
        app_role = user_meta.get("app_role") or user_meta.get("role")
    if not app_role and isinstance(app_meta, dict):
        app_role = app_meta.get("app_role") or app_meta.get("role")

    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "app_role": app_role,
        "claims": claims,
        "access_token": token,
    }
