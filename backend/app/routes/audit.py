from fastapi import APIRouter, Depends

from app.core.auth import get_current_user as require_user
from app.db.supabase_http import sb_get

router = APIRouter(prefix="/audit_logs", tags=["audit"])

REST = "/rest/v1"


@router.get("")
def list_audit_logs(actor: dict = Depends(require_user)) -> list[dict]:
    jwt = actor["access_token"]

    rows = sb_get(
        f"{REST}/audit_logs",
        user_jwt=jwt,
        params={
            "select": "*",
            "order": "created_at.desc",
            "limit": 200,
        },
    )

    return rows