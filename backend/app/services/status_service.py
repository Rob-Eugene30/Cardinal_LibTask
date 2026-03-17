from app.core.errors import bad_request, forbidden, not_found
from app.db.supabase_http import sb_admin_patch, sb_admin_post, sb_get
from app.services.task_service import normalize_status
from app.services.audit_service import log_audit

REST = "/rest/v1"


def _ensure_can_update(task: dict, actor: dict) -> None:
    if actor.get("app_role") == "admin":
        return
    if task.get("assigned_to") != actor.get("user_id"):
        forbidden("You can only update tasks assigned to you.")


def add_status_update(task_id: str, new_status: str, note: str | None, actor: dict) -> dict:
    status_value = normalize_status(new_status)
    if not status_value:
        bad_request("Status is required.")

    rows = sb_get(
        f"{REST}/tasks",
        user_jwt=actor["access_token"],
        params={"select": "id,assigned_to", "id": f"eq.{task_id}", "limit": 1},
    )
    if not rows:
        not_found("Task not found.")

    task = rows[0]
    _ensure_can_update(task, actor)

    sb_admin_patch(
        f"{REST}/tasks",
        json={"status": status_value},
        params={"id": f"eq.{task_id}", "select": "id,status"},
        extra_headers={"Prefer": "return=representation"},
    )

    history = sb_admin_post(
        f"{REST}/status_updates",
        json={
            "task_id": task_id,
            "status": status_value,
            "note": note,
            "updated_by": actor["user_id"],
        },
        params={"select": "*"},
        extra_headers={"Prefer": "return=representation"},
    )

    if not history:
        bad_request("Status update not recorded.")

    log_audit(
        actor=actor,
        action="status_update",
        entity_type="task",
        entity_id=task_id,
        new_data={"status": status_value, "note": note},
    )

    return history[0]

def list_status_updates(task_id: str, actor: dict) -> list[dict]:
    return sb_get(
        f"{REST}/status_updates",
        user_jwt=actor["access_token"],
        params={
            "select": "*",
            "task_id": f"eq.{task_id}",
            "order": "created_at.desc",
        },
    )