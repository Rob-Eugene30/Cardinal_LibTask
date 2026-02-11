from datetime import date
from fastapi import APIRouter, Depends, Query

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.services.report_service import (
    tasks_summary,
    staff_summary,
    tag_summary,
)

router = APIRouter()


@router.get("/tasks-summary")
def get_tasks_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return tasks_summary(user, start_date=start_date, end_date=end_date)


@router.get("/staff-summary")
def get_staff_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return staff_summary(user, start_date=start_date, end_date=end_date)


@router.get("/tag-summary")
def get_tag_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    return tag_summary(user, start_date=start_date, end_date=end_date)
