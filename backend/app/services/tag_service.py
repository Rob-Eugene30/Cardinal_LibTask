from app.db.supabase_http import sb_get, sb_post, sb_delete
from app.core.errors import bad_request

REST = "/rest/v1"


def list_tags(user_jwt: str) -> list[dict]:
    return sb_get(
        f"{REST}/tags",
        user_jwt=user_jwt,
        params={"select": "id,name,created_at", "order": "name.asc"},
    )


def create_tag(name: str, user_jwt: str) -> dict:
    rows = sb_post(
        f"{REST}/tags",
        user_jwt=user_jwt,
        json={"name": name},
        params={"select": "id,name,created_at"},
    )
    if not rows:
        bad_request("Tag not created.")
    return rows[0]


def delete_tag(tag_id: str, user_jwt: str) -> None:
    sb_delete(
        f"{REST}/tags",
        user_jwt=user_jwt,
        params={"id": f"eq.{tag_id}"},
    )