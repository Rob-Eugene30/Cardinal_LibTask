from app.db.supabase_http import sb_get, sb_post, sb_delete
from app.core.errors import bad_request
from app.services.audit_service import log_audit

REST = "/rest/v1"


def list_tags(user_jwt: str) -> list[dict]:
    return sb_get(
        f"{REST}/tags",
        user_jwt=user_jwt,
        params={"select": "id,name,created_at", "order": "name.asc"},
    )


def create_tag(name: str, user_jwt: str, actor: dict) -> dict:
    rows = sb_post(
        f"{REST}/tags",
        user_jwt=user_jwt,
        json={"name": name},
        params={"select": "id,name,created_at"},
    )
    if not rows:
        bad_request("Tag not created.")

    tag = rows[0]

    log_audit(
        actor=actor,
        action="create",
        entity_type="tag",
        entity_id=tag["id"],
        new_data=tag,
    )

    return tag


def delete_tag(tag_id: str, user_jwt: str, actor: dict) -> None:
    old = sb_get(
        f"{REST}/tags",
        user_jwt=user_jwt,
        params={"id": f"eq.{tag_id}", "limit": 1},
    )
    old_data = old[0] if old else None

    sb_delete(
        f"{REST}/tags",
        user_jwt=user_jwt,
        params={"id": f"eq.{tag_id}"},
    )

    log_audit(
        actor=actor,
        action="delete",
        entity_type="tag",
        entity_id=tag_id,
        old_data=old_data,
    )