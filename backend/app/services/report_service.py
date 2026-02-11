from __future__ import annotations
from datetime import datetime, timezone, date

from app.core.errors import forbidden
from app.db.reports_repo import (
    query_tasks_summary,
    query_staff_summary,
    query_tag_summary,
)

CLOSED_STATUSES = {"completed", "cancelled"}  # align with your canonical statuses


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _filters(start_date: date | None, end_date: date | None) -> dict:
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
    }


def _admin_jwt(actor: dict) -> str:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor.get("access_token")
    if not jwt:
        forbidden("Missing access token.")
    return jwt


def tasks_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)
    row = query_tasks_summary(jwt, start_date=start_date, end_date=end_date, closed_statuses=CLOSED_STATUSES)

    return {
        "generated_at": _now_iso(),
        "filters": _filters(start_date, end_date),
        # keep this stable for frontend types: TasksSummary
        "total_tasks": row["total_tasks"],
        "open_tasks": row["open_tasks"],
        "closed_tasks": row["closed_tasks"],
        "by_status": row["by_status"],  # [{label,count}]
    }


def staff_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)
    items = query_staff_summary(jwt, start_date=start_date, end_date=end_date, closed_statuses=CLOSED_STATUSES)
    items.sort(key=lambda x: x["total_tasks"], reverse=True)

    return {
        "generated_at": _now_iso(),
        "filters": _filters(start_date, end_date),
        "items": items,  # StaffSummaryRow[]
    }


def tag_summary(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    jwt = _admin_jwt(actor)
    items = query_tag_summary(jwt, start_date=start_date, end_date=end_date)
    items.sort(key=lambda x: (-x["total_tasks"], x["tag"]))

    return {
        "generated_at": _now_iso(),
        "filters": _filters(start_date, end_date),
        "items": items,  # TagSummaryRow[]
    }
