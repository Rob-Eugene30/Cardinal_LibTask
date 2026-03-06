from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.errors import bad_request, unauthorized, not_found
from app.core.roles import require_admin
from app.db.supabase_http import sb_get, sb_admin_post, sb_admin_get

router = APIRouter()


class StaffInviteIn(BaseModel):
    staff_code: str = Field(min_length=1, max_length=32)
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    phone: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=300)
    department: str | None = Field(default=None, max_length=120)
    job_title: str | None = Field(default=None, max_length=120)
    availability: str = Field(default="Available", max_length=30)
    employment_status: str = Field(default="Active", max_length=30)
    employee_since: str | None = None  # YYYY-MM-DD


def _auth_admin_invite(email: str) -> dict:
    if not settings.SUPABASE_URL:
        bad_request("SUPABASE_URL is not configured.")
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        bad_request("SUPABASE_SERVICE_ROLE_KEY is not configured.")

    rows = sb_admin_post("/auth/v1/invite", json={"email": email})
    if not isinstance(rows, dict) or not rows.get("id"):
        unauthorized("Invite failed (no user id returned).")
    return rows


@router.get("/staff", response_model=List[Dict[str, Any]])
def list_staff(user=Depends(require_admin)):
    access_token = user.get("access_token")
    rows = sb_get(
        "/rest/v1/profiles",
        user_jwt=access_token,
        params={
            "select": "id,staff_code,full_name,email,phone,address,department,job_title,availability,employment_status,employee_since,role,created_at,updated_at",
            "role": "eq.staff",
            "order": "full_name.asc.nullslast",
        },
    )
    return rows


@router.get("/staff/{staff_id}", response_model=Dict[str, Any])
def get_staff(staff_id: str, user=Depends(require_admin)):
    access_token = user.get("access_token")
    rows = sb_get(
        "/rest/v1/profiles",
        user_jwt=access_token,
        params={
            "select": "id,staff_code,full_name,email,phone,address,department,job_title,availability,employment_status,employee_since,role,created_at,updated_at",
            "id": f"eq.{staff_id}",
            "limit": 1,
        },
    )
    if not rows:
        not_found("Staff not found.")
    return rows[0]


@router.post("/staff/invite", response_model=Dict[str, Any])
def invite_staff(payload: StaffInviteIn, user=Depends(require_admin)):
    invited = _auth_admin_invite(payload.email.strip().lower())
    user_id = invited["id"]

    profile_row = {
        "id": user_id,
        "role": "staff",
        "staff_code": payload.staff_code,
        "full_name": payload.full_name,
        "email": payload.email.strip().lower(),
        "phone": payload.phone,
        "address": payload.address,
        "department": payload.department,
        "job_title": payload.job_title,
        "availability": payload.availability,
        "employment_status": payload.employment_status,
        "employee_since": payload.employee_since,
    }

    out = sb_admin_post(
        "/rest/v1/profiles",
        json=[profile_row],
        params={
            "select": "id,staff_code,full_name,email,phone,address,department,job_title,availability,employment_status,employee_since,role,created_at,updated_at",
            "on_conflict": "id",
        },
        extra_headers={"Prefer": "resolution=merge-duplicates,return=representation"},
    )

    if isinstance(out, list) and out:
        return out[0]

    fetched = sb_admin_get(
        "/rest/v1/profiles",
        params={
            "select": "id,staff_code,full_name,email,phone,address,department,job_title,availability,employment_status,employee_since,role,created_at,updated_at",
            "id": f"eq.{user_id}",
            "limit": 1,
        },
    )
    if isinstance(fetched, list) and fetched:
        return fetched[0]

    bad_request("Profile upsert failed.")