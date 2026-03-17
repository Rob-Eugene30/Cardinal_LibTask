from app.db.supabase_http import sb_post

REST = "/rest/v1"


def log_audit(
    *,
    actor: dict,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    old_data: dict | None = None,
    new_data: dict | None = None,
):
    jwt = actor.get("access_token")

    payload = {
        "user_id": actor.get("user_id"),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_data": old_data,
        "new_data": new_data,
    }

    sb_post(
        f"{REST}/audit_logs",
        user_jwt=jwt,
        json=payload,
    )