from app.db.supabase_http import sb_get, sb_post, sb_patch, sb_delete
from app.core.errors import forbidden, not_found, bad_request

REST = "/rest/v1"


def list_tasks(actor: dict) -> list[dict]:
    jwt = actor["access_token"]
    # RLS should restrict staff to assigned_to = auth.uid()
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
            "title": payload["title"],
            "description": payload.get("description"),
            "due_date": payload.get("due_date"),
            "created_by": actor["sub"],
            "assigned_to": payload["assigned_to"],
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

    # Patch and return updated row
    rows = sb_patch(
        f"{REST}/tasks",
        user_jwt=jwt,
        json=patch,
        params={"id": f"eq.{task_id}", "select": "*"},
    )
    if not rows:
        not_found("Task not found or not updated.")
    return rows[0]


def set_task_tags(task_id: str, tag_ids: list[str], actor: dict) -> dict:
    """
    Replace all tags for a task.
    Uses task_tags join table.
    """
    if actor.get("app_role") != "admin":
        forbidden("Only admin can modify task tags.")

    jwt = actor["access_token"]

    # Ensure task exists (admin should see it)
    _ = get_task(task_id, actor)

    # Delete existing
    sb_delete(
        f"{REST}/task_tags",
        user_jwt=jwt,
        params={"task_id": f"eq.{task_id}"},
    )

    if tag_ids:
        payload = [{"task_id": task_id, "tag_id": tid} for tid in tag_ids]
        sb_post(
            f"{REST}/task_tags",
            user_jwt=jwt,
            json=payload,
            params={"select": "task_id,tag_id"},
        )

    return {"ok": True, "task_id": task_id, "tag_ids": tag_ids}
