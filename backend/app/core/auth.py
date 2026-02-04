import time
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.utils import base64url_decode

from app.core.config import settings
from app.core.errors import unauthorized

bearer = HTTPBearer(auto_error=False)

_JWKS_CACHE: Dict[str, Any] = {"jwks": None, "ts": 0}
_JWKS_TTL_SECONDS = 60 * 30  # 30 minutes


def _jwks_url() -> str:
    # Supabase public JWKS endpoint
    return f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _get_jwks() -> dict:
    now = int(time.time())
    if _JWKS_CACHE["jwks"] and (now - _JWKS_CACHE["ts"] < _JWKS_TTL_SECONDS):
        return _JWKS_CACHE["jwks"]

    if not settings.SUPABASE_URL:
        unauthorized("SUPABASE_URL is not configured.")

    with httpx.Client(timeout=10.0) as client:
        r = client.get(_jwks_url())
        if r.status_code != 200:
            unauthorized("Failed to fetch Supabase JWKS.")
        jwks = r.json()

    _JWKS_CACHE["jwks"] = jwks
    _JWKS_CACHE["ts"] = now
    return jwks


def _get_signing_key(token: str) -> dict:
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        unauthorized("Token header missing 'kid'.")

    jwks = _get_jwks()
    keys = jwks.get("keys", [])
    for k in keys:
        if k.get("kid") == kid:
            return k

    unauthorized("No matching JWKS key found for token.")


def _derive_issuer() -> str:
    if settings.JWT_ISSUER:
        return settings.JWT_ISSUER
    if settings.SUPABASE_URL:
        # Supabase issuer is typically the project URL
        return settings.SUPABASE_URL.rstrip("/")
    return ""


def verify_supabase_jwt(token: str) -> dict:
    alg = settings.SUPABASE_JWT_ALG.upper().strip()

    options = {
        "verify_aud": True,
        "verify_signature": True,
        "verify_exp": True,
        "verify_iss": True,
    }

    issuer = _derive_issuer()
    if not issuer:
        unauthorized("JWT issuer is not configured.")

    try:
        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                unauthorized("SUPABASE_JWT_SECRET is required for HS256.")
            claims = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=settings.JWT_AUDIENCE,
                issuer=issuer,
                options=options,
            )
        else:
            # Default to RS256/JWKS flow
            jwk_key = _get_signing_key(token)
            claims = jwt.decode(
                token,
                jwk_key,
                algorithms=[alg],
                audience=settings.JWT_AUDIENCE,
                issuer=issuer,
                options=options,
            )
    except Exception:
        unauthorized("Invalid or expired token.")

    # Normalize app role:
    # - Prefer user_metadata.app_role (you control this)
    # - Default to staff
    user_metadata = claims.get("user_metadata") or {}
    app_role = user_metadata.get("app_role") or "staff"

    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "app_role": app_role,
        "claims": claims,
    }


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if not creds or not creds.credentials:
        unauthorized("Missing Bearer token.")
    return verify_supabase_jwt(creds.credentials)
