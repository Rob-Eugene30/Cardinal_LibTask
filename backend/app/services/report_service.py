from __future__ import annotations
from datetime import datetime, timezone, date
from collections import defaultdict

from app.db.supabase_http import sb_get
from app.core.errors import forbidden

REST = "/rest/v1"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def report_tasks_by_status(actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor["access_token"]

    rows = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params={"select": "status"},
    )
    counts = defaultdict(int)
    for r in rows:
        counts[r["status"]] += 1

    return {
        "generated_at": _now_iso(),
        "counts": [{"label": k, "count": v} for k, v in sorted(counts.items())],
    }


def report_tasks_by_staff(actor: dict, start_date: date | None = None, end_date: date | None = None) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor["access_token"]

    params = {"select": "assigned_to,created_at"}
    if start_date:
        params["created_at"] = f"gte.{start_date.isoformat()}"
    if end_date:
        # combine with existing created_at filter if present: PostgREST doesn't support two keys same name.
        # For simplicity, if both given, do client-side filter.
        pass

    tasks = sb_get(f"{REST}/tasks", user_jwt=jwt, params={"select": "assigned_to,created_at,status"})
    # client-side date filter (safe and simple)
    filtered = []
    for t in tasks:
        created = t.get("created_at")
        if created:
            d = datetime.fromisoformat(created.replace("Z", "+00:00")).date()
            if start_date and d < start_date:
                continue
            if end_date and d > end_date:
                continue
        filtered.append(t)

    by_staff = defaultdict(lambda: {"total": 0, "open": 0, "closed": 0})
    for t in filtered:
        staff_id = t["assigned_to"]
        by_staff[staff_id]["total"] += 1
        if t["status"] in ("done", "cancelled"):
            by_staff[staff_id]["closed"] += 1
        else:
            by_staff[staff_id]["open"] += 1

    items = [
        {
            "staff_id": staff,
            "total_tasks": stats["total"],
            "open_tasks": stats["open"],
            "closed_tasks": stats["closed"],
        }
        for staff, stats in by_staff.items()
    ]
    items.sort(key=lambda x: x["total_tasks"], reverse=True)

    return {"generated_at": _now_iso(), "items": items}


def report_tasks_by_tag(actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")
    jwt = actor["access_token"]

    # Fetch joins + tags
    joins = sb_get(f"{REST}/task_tags", user_jwt=jwt, params={"select": "tag_id"})
    tags = sb_get(f"{REST}/tags", user_jwt=jwt, params={"select": "id,name"})

    tag_name = {t["id"]: t["name"] for t in tags}
    counts = defaultdict(int)
    for j in joins:
        tid = j["tag_id"]
        counts[tag_name.get(tid, tid)] += 1

    items = [{"tag": k, "total_tasks": v} for k, v in sorted(counts.items(), key=lambda x: (-x[1], x[0]))]
    return {"generated_at": _now_iso(), "items": items}
