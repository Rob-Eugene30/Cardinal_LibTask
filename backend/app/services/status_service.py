from app.db.client import fetch_one, fetch_all, execute
from app.core.errors import not_found, forbidden, bad_request

ALLOWED_STATUSES = {"open", "in_progress", "blocked", "done", "cancelled"}

def add_status_update(task_id: int, new_status: str, note: str | None, actor: dict) -> dict:
    if actor["app_role"] != "admin":
        forbidden("Only admin can update task status.")

    if new_status not in ALLOWED_STATUSES:
        bad_request(f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}")

    task = fetch_one("select id from tasks where id=:id", {"id": task_id})
    if not task:
        not_found("Task not found.")

    created = fetch_one(
        """
        insert into status_updates(task_id, status, note, updated_by)
        values(:task_id, :status, :note, :updated_by)
        returning id, task_id, status, note, updated_by, created_at
        """,
        {"task_id": task_id, "status": new_status, "note": note, "updated_by": actor["sub"]},
    )
    return created

def list_status_updates(task_id: int, actor: dict) -> list[dict]:
    # Staff can see status history only for tasks assigned to them
    task = fetch_one("select id, assigned_to from tasks where id=:id", {"id": task_id})
    if not task:
        not_found("Task not found.")
    if actor["app_role"] != "admin" and task["assigned_to"] != actor["sub"]:
        forbidden("You can only view status updates for your tasks.")

    return fetch_all(
        """
        select id, task_id, status, note, updated_by, created_at
        from status_updates
        where task_id=:id
        order by created_at desc
        """,
        {"id": task_id},
    )
