from fastapi import APIRouter
from pydantic import BaseModel
import httpx

from app.core.config import settings
from app.core.errors import bad_request, unauthorized

router = APIRouter()


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/auth/login")
def login(payload: LoginIn):
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    if not settings.SUPABASE_ANON_KEY:
        bad_request("SUPABASE_ANON_KEY is not configured.")

    url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/token?grant_type=password"

    headers = {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }

    body = {"email": payload.email, "password": payload.password}

    try:
        with httpx.Client(timeout=15) as client:
            r = client.post(url, headers=headers, json=body)
    except Exception:
        unauthorized("Unable to contact Supabase Auth.")

    if r.status_code >= 400:
        # Return Supabase's real error message for debugging
        try:
            j = r.json()
            msg = (
                j.get("error_description")
                or j.get("message")
                or j.get("msg")
                or j.get("error")
                or str(j)
            )
        except Exception:
            msg = r.text or "Invalid login."
        unauthorized(msg)

    data = r.json()

    return {
        "access_token": data.get("access_token"),
        "token_type": data.get("token_type"),
        "expires_in": data.get("expires_in"),
        "refresh_token": data.get("refresh_token"),
        "user": data.get("user"),
    }
