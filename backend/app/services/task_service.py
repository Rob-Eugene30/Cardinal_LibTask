from datetime import date, datetime

from app.core.errors import bad_request, forbidden, not_found
from app.db.supabase_http import sb_delete, sb_get, sb_patch, sb_post

REST = "/rest/v1"

_STATUS_ALIAS_MAP = {
    "pending": "pending",
    "not yet started": "pending",
    "in_progress": "in_progress",
    "in progress": "in_progress",
    "done": "done",
    "finished": "done",
    "on_hold": "on_hold",
    "on hold": "on_hold",
    "cancelled": "cancelled",
    "abolished": "cancelled",
}

_ALLOWED_STATUSES = {"pending", "in_progress", "done", "on_hold", "cancelled"}
_ALLOWED_PRIORITIES = {"Low", "Medium", "High"}


def _normalize_due_date(value) -> str | None:
    if value in (None, ""):
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()

    text = str(value).strip()
    if not text:
        return None
    if "T" in text:
        return text.split("T", 1)[0]
    return text


def normalize_status(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = _STATUS_ALIAS_MAP.get(str(value).strip().lower())
    if not normalized:
        bad_request(f"Invalid status. Allowed: {sorted(_ALLOWED_STATUSES)}")
    return normalized


def normalize_priority(value: str | None) -> str:
    if value is None:
        return "Medium"

    raw = str(value).strip().lower()
    mapping = {
        "low": "Low",
        "medium": "Medium",
        "high": "High",
    }
    normalized = mapping.get(raw)
    if not normalized:
        bad_request(f"Invalid priority. Allowed: {sorted(_ALLOWED_PRIORITIES)}")
    return normalized


def list_tasks(actor: dict) -> list[dict]:
    jwt = actor["access_token"]
    return sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params={"select": "*", "order": "created_at.desc"},
    )


def get_task(task_id: str, actor: dict) -> dict:
    jwt = actor["access_token"]
    rows = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params={"select": "*", "id": f"eq.{task_id}", "limit": 1},
    )
    if not rows:
        not_found("Task not found.")
    return rows[0]


def create_task(payload: dict, actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")

    jwt = actor["access_token"]
    rows = sb_post(
        f"{REST}/tasks",
        user_jwt=jwt,
        json={
            "title": payload["title"].strip(),
            "description": payload.get("description"),
            "due_date": _normalize_due_date(payload.get("due_date")),
            "created_by": actor["user_id"],
            "assigned_to": payload["assigned_to"],
            "priority": normalize_priority(payload.get("priority")),
            "status": "pending",
        },
        params={"select": "*"},
    )
    if not rows:
        bad_request("Task not created.")
    return rows[0]


def update_task_basic(task_id: str, patch: dict, actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Admin access required.")

    jwt = actor["access_token"]
    out: dict = {}

    if "title" in patch and patch["title"] is not None:
        out["title"] = str(patch["title"]).strip()
    if "description" in patch:
        out["description"] = patch["description"]
    if "due_date" in patch:
        out["due_date"] = _normalize_due_date(patch["due_date"])
    if "assigned_to" in patch and patch["assigned_to"] is not None:
        out["assigned_to"] = patch["assigned_to"]
    if "status" in patch:
        out["status"] = normalize_status(patch["status"])
    if "priority" in patch:
        out["priority"] = normalize_priority(patch["priority"])

    if not out:
        bad_request("No valid fields provided.")

    rows = sb_patch(
        f"{REST}/tasks",
        user_jwt=jwt,
        json=out,
        params={"id": f"eq.{task_id}", "select": "*"},
    )
    if not rows:
        not_found("Task not found or not updated.")
    return rows[0]


def set_task_tags(task_id: str, tag_ids: list[str], actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Only admin can modify task tags.")

    jwt = actor["access_token"]
    _ = get_task(task_id, actor)

    sb_delete(
        f"{REST}/task_tags",
        user_jwt=jwt,
        params={"task_id": f"eq.{task_id}"},
    )

    clean_tag_ids = [tag_id for tag_id in tag_ids if str(tag_id).strip()]
    if clean_tag_ids:
        payload = [{"task_id": task_id, "tag_id": tid} for tid in clean_tag_ids]
        sb_post(
            f"{REST}/task_tags",
            user_jwt=jwt,
            json=payload,
            params={"select": "task_id,tag_id"},
        )

    return {"ok": True, "task_id": task_id, "tag_ids": clean_tag_ids}