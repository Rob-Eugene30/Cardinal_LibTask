from datetime import date
from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.services.report_service import (
    report_tasks_by_status,
    report_tasks_by_staff,
    report_tasks_by_tag,
)

router = APIRouter()

@router.get("/by-status")
def get_report_by_status(user=Depends(get_current_user)):
    require_admin(user)
    return report_tasks_by_status(user)

@router.get("/by-staff")
def get_report_by_staff(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return report_tasks_by_staff(user, start_date=start_date, end_date=end_date)

@router.get("/by-tag")
def get_report_by_tag(user=Depends(get_current_user)):
    require_admin(user)
    return report_tasks_by_tag(user)
