from app.db.supabase_http import sb_get, sb_post, sb_patch
from app.core.errors import forbidden, not_found, bad_request

REST = "/rest/v1"

# These are the exact labels used by the current UI.
ALLOWED_STATUSES = {
    "Not Yet Started",
    "In Progress",
    "Finished",
    "On Hold",
    "Abolished",
}


def _ensure_can_update(task: dict, actor: dict) -> None:
    """Admin can update any task. Staff can only update tasks assigned to them."""
    if actor.get("app_role") == "admin":
        return
    if task.get("assigned_to") != actor.get("user_id"):
        forbidden("You can only update tasks assigned to you.")


def add_status_update(task_id: str, new_status: str, note: str | None, actor: dict) -> dict:
    if new_status not in ALLOWED_STATUSES:
        bad_request(f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}")

    jwt = actor["access_token"]

    # Fetch the task (RLS will already restrict staff to their own tasks)
    rows = sb_get(
        f"{REST}/tasks",
        user_jwt=jwt,
        params={"select": "id,assigned_to", "id": f"eq.{task_id}", "limit": 1},
    )
    if not rows:
        not_found("Task not found.")

    task = rows[0]
    _ensure_can_update(task, actor)

    # Update task.status
    sb_patch(
        f"{REST}/tasks",
        user_jwt=jwt,
        json={"status": new_status},
        params={"id": f"eq.{task_id}", "select": "id,status"},
    )

    # Insert history
    hist = sb_post(
        f"{REST}/status_updates",
        user_jwt=jwt,
        json={
            "task_id": task_id,
            "status": new_status,
            "note": note,
            "updated_by": actor["user_id"],
        },
        params={"select": "*"},
    )
    if not hist:
        bad_request("Status update not recorded.")
    return hist[0]


def list_status_updates(task_id: str, actor: dict) -> list[dict]:
    jwt = actor["access_token"]
    return sb_get(
        f"{REST}/status_updates",
        user_jwt=jwt,
        params={
            "select": "*",
            "task_id": f"eq.{task_id}",
            "order": "created_at.desc",
        },
    )