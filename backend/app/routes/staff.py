from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from app.core.roles import require_admin
from app.db.supabase_http import sb_get

router = APIRouter()


@router.get("/staff", response_model=List[Dict[str, Any]])
def list_staff(user=Depends(require_admin)):
    """
    Returns staff profiles from Supabase (public.profiles).
    Requires admin.
    """
    access_token = user.get("access_token")

    # PostgREST query to Supabase
    rows = sb_get(
        "/rest/v1/profiles",
        user_jwt=access_token,
        params={
            "select": "id,full_name,role,created_at,updated_at",
            "role": "eq.staff",
            "order": "full_name.asc.nullslast",
        },
    )

    return rows
