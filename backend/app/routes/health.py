from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.supabase_http import sb_get

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/health/supabase")
def health_supabase(user=Depends(get_current_user)):
    # Proves HTTPS + JWT + RLS path works
    rows = sb_get(
        "/rest/v1/tags",
        user_jwt=user["access_token"],
        params={"select": "id,name", "limit": 1},
    )
    return {"ok": True, "sample": rows}
