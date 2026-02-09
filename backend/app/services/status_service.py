from app.db.supabase_http import sb_get, sb_post, sb_patch
from app.core.errors import forbidden, not_found, bad_request

REST = "/rest/v1"
ALLOWED_STATUSES = {"pending", "in_progress", "done", "cancelled"}


def add_status_update(task_id: str, new_status: str, note: str | None, actor: dict) -> dict:
    if actor.get("app_role") != "admin":
        forbidden("Only admin can update task status.")

    if new_status not in ALLOWED_STATUSES:
        bad_request(f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}")

    jwt = actor["access_token"]

    # Ensure task exists
    t = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params={"select": "id", "id": f"eq.{task_id}", "limit": 1},
    )
    if not t:
        not_found("Task not found.")

    # Update task.status
    sb_patch(
        f"{REST}/tasks",
        user_jwt=jwt,
        json={"status": new_status},
        params={"id": f"eq.{task_id}", "select": "id,status"},
    )

    # Insert history
    rows = sb_post(
        f"{REST}/status_updates",
        user_jwt=jwt,
        json={
            "task_id": task_id,
            "status": new_status,
            "note": note,
            "updated_by": actor["sub"],
        },
        params={"select": "*"},
    )
    if not rows:
        bad_request("Status update not recorded.")
    return rows[0]


def list_status_updates(task_id: str, actor: dict) -> list[dict]:
    jwt = actor["access_token"]
    # RLS should restrict staff to tasks assigned to them
    return sb_get(
        f"{REST}/status_updates",
        user_jwt=jwt,
        params={
            "select": "*",
            "task_id": f"eq.{task_id}",
            "order": "created_at.desc",
        },
    )
