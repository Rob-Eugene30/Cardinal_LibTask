from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/debug/env")
def debug_env():
    key = settings.SUPABASE_ANON_KEY or ""
    masked = (key[:8] + "..." + key[-6:]) if len(key) > 20 else "(missing)"
    return {
        "SUPABASE_URL": settings.SUPABASE_URL,
        "SUPABASE_ANON_KEY_masked": masked,
        "JWT_ISSUER": settings.JWT_ISSUER,
        "JWT_AUDIENCE": settings.JWT_AUDIENCE,
        "SUPABASE_JWT_ALG": settings.SUPABASE_JWT_ALG,
    }
