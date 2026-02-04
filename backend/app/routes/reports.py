from datetime import date
from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.services.report_service import report_by_staff, report_by_tag

router = APIRouter()

@router.get("/by-staff")
def get_report_by_staff(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return {"items": report_by_staff(start_date, end_date)}

@router.get("/by-tag")
def get_report_by_tag(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return {"items": report_by_tag(start_date, end_date)}
