from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.services.report_service import (
    tasks_summary,
    staff_summary,
    tag_summary,
    export_tasks_summary_csv,
    export_staff_summary_csv,
    export_tag_summary_csv,
    export_tasks_summary_pdf,
    export_staff_summary_pdf,
    export_tag_summary_pdf,
)

router = APIRouter()


# JSON endpoints
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


# CSV export endpoints
@router.get("/tasks-summary.csv")
def get_tasks_summary_csv(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_tasks_summary_csv(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="tasks-summary.csv"'},
    )


@router.get("/staff-summary.csv")
def get_staff_summary_csv(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_staff_summary_csv(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="staff-summary.csv"'},
    )


@router.get("/tag-summary.csv")
def get_tag_summary_csv(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_tag_summary_csv(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="tag-summary.csv"'},
    )


# PDF export endpoints
@router.get("/tasks-summary.pdf")
def get_tasks_summary_pdf(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_tasks_summary_pdf(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="tasks-summary.pdf"'},
    )


@router.get("/staff-summary.pdf")
def get_staff_summary_pdf(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_staff_summary_pdf(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="staff-summary.pdf"'},
    )


@router.get("/tag-summary.pdf")
def get_tag_summary_pdf(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(get_current_user),
):
    require_admin(user)
    data = export_tag_summary_pdf(user, start_date=start_date, end_date=end_date)
    return StreamingResponse(
        data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="tag-summary.pdf"'},
    )
