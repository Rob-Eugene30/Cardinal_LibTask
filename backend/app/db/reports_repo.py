from __future__ import annotations
from datetime import date
from collections import defaultdict

from app.db.supabase_http import sb_get

REST = "/rest/v1"


def _range_filter_params(start_date: date | None, end_date: date | None) -> dict:
    """
    PostgREST supports AND conditions via: and=(created_at.gte.YYYY-MM-DD,created_at.lte.YYYY-MM-DD)
    Inclusive range.
    """
    if not start_date and not end_date:
        return {}

    parts: list[str] = []
    if start_date:
        parts.append(f"created_at.gte.{start_date.isoformat()}")
    if end_date:
        parts.append(f"created_at.lte.{end_date.isoformat()}")

    return {"and": f"({','.join(parts)})"}


def query_tasks_summary(
    user_jwt: str,
    start_date: date | None,
    end_date: date | None,
    closed_statuses: set[str],
) -> dict:
    params = {"select": "status"}
    params.update(_range_filter_params(start_date, end_date))

    rows = sb_get(f"{REST}/tasks", user_jwt=user_jwt, params=params)

    total = 0
    closed = 0
    by_status = defaultdict(int)

    for r in rows:
        total += 1
        status = (r.get("status") or "unknown").lower()
        by_status[status] += 1
        if status in closed_statuses:
            closed += 1

    open_tasks = total - closed
    by_status_items = [{"label": k, "count": v} for k, v in sorted(by_status.items())]

    return {
        "total_tasks": total,
        "open_tasks": open_tasks,
        "closed_tasks": closed,
        "by_status": by_status_items,
    }


def query_staff_summary(
    user_jwt: str,
    start_date: date | None,
    end_date: date | None,
    closed_statuses: set[str],
) -> list[dict]:
    params = {"select": "assigned_to,status"}
    params.update(_range_filter_params(start_date, end_date))

    rows = sb_get(f"{REST}/tasks", user_jwt=user_jwt, params=params)

    by_staff = defaultdict(lambda: {"total_tasks": 0, "open_tasks": 0, "closed_tasks": 0})

    for r in rows:
        staff_id = r.get("assigned_to")
        if not staff_id:
            continue

        stats = by_staff[staff_id]
        stats["total_tasks"] += 1

        status = (r.get("status") or "unknown").lower()
        if status in closed_statuses:
            stats["closed_tasks"] += 1
        else:
            stats["open_tasks"] += 1

    return [{"staff_id": sid, **stats} for sid, stats in by_staff.items()]


def query_tag_summary(
    user_jwt: str,
    start_date: date | None,
    end_date: date | None,
) -> list[dict]:
    # Date filter must apply to tasks, not task_tags.
    task_params = {"select": "id"}
    task_params.update(_range_filter_params(start_date, end_date))
    tasks = sb_get(f"{REST}/tasks", user_jwt=user_jwt, params=task_params)

    task_ids = [t["id"] for t in tasks if "id" in t]
    if not task_ids:
        return []

    tags = sb_get(f"{REST}/tags", user_jwt=user_jwt, params={"select": "id,name"})
    tag_name = {t["id"]: t["name"] for t in tags}

    joins = sb_get(
        f"{REST}/task_tags",
        user_jwt=user_jwt,
        params={
            "select": "tag_id,task_id",
            "task_id": f"in.({','.join(map(str, task_ids))})",
        },
    )

    counts = defaultdict(int)
    for j in joins:
        tid = j.get("tag_id")
        label = tag_name.get(tid, str(tid))
        counts[label] += 1

    return [{"tag": k, "total_tasks": v} for k, v in counts.items()]
