from app.db.client import fetch_all, fetch_one, execute
from app.core.errors import not_found, forbidden

def create_task(payload: dict, actor: dict) -> dict:
    created = fetch_one(
        """
        insert into tasks(title, description, assigned_to, created_by, due_date)
        values(:title, :description, :assigned_to, :created_by, :due_date)
        returning id, title, description, assigned_to, created_by, due_date, created_at
        """,
        {
            "title": payload["title"],
            "description": payload.get("description"),
            "assigned_to": payload["assigned_to"],
            "created_by": actor["sub"],
            "due_date": payload.get("due_date"),
        },
    )
    return created

def get_task(task_id: int, actor: dict) -> dict:
    task = fetch_one(
        """
        select id, title, description, assigned_to, created_by, due_date, created_at
        from tasks
        where id=:id
        """,
        {"id": task_id},
    )
    if not task:
        not_found("Task not found.")

    if actor["app_role"] != "admin" and task["assigned_to"] != actor["sub"]:
        forbidden("You can only view tasks assigned to you.")
    return task

def list_tasks(actor: dict) -> list[dict]:
    if actor["app_role"] == "admin":
        return fetch_all(
            """
            select id, title, description, assigned_to, created_by, due_date, created_at
            from tasks
            order by created_at desc
            """
        )

    return fetch_all(
        """
        select id, title, description, assigned_to, created_by, due_date, created_at
        from tasks
        where assigned_to=:uid
        order by created_at desc
        """,
        {"uid": actor["sub"]},
    )

def set_task_tags(task_id: int, tag_ids: list[int], actor: dict) -> None:
    # Only admin can tag tasks (simple rule; change if you want)
    if actor["app_role"] != "admin":
        forbidden("Only admin can modify task tags.")

    task = fetch_one("select id from tasks where id=:id", {"id": task_id})
    if not task:
        not_found("Task not found.")

    execute("delete from task_tags where task_id=:tid", {"tid": task_id})
    for tag_id in tag_ids:
        execute(
            "insert into task_tags(task_id, tag_id) values(:tid, :gid) on conflict do nothing",
            {"tid": task_id, "gid": tag_id},
        )
