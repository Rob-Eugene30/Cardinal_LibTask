from app.db.client import fetch_all, fetch_one, execute
from app.core.errors import bad_request, not_found

def create_tag(name: str) -> dict:
    row = fetch_one("select id from tags where name=:name", {"name": name})
    if row:
        bad_request("Tag already exists.")

    created = fetch_one(
        "insert into tags(name) values(:name) returning id, name",
        {"name": name},
    )
    return created

def list_tags() -> list[dict]:
    return fetch_all("select id, name from tags order by name asc")

def delete_tag(tag_id: int) -> None:
    row = fetch_one("select id from tags where id=:id", {"id": tag_id})
    if not row:
        not_found("Tag not found.")
    execute("delete from tags where id=:id", {"id": tag_id})
