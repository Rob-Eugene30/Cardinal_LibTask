from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.schemas.tag import TagCreate, TagOut
from app.services.tag_service import list_tags, create_tag, delete_tag

router = APIRouter()

@router.get("", response_model=list[TagOut])
def get_tags(user=Depends(get_current_user)):
    return list_tags(user["access_token"])

@router.post("", response_model=TagOut)
def post_tag(payload: TagCreate, user=Depends(get_current_user)):
    require_admin(user)
    return create_tag(payload.name, user["access_token"])

@router.delete("/{tag_id}")
def remove_tag(tag_id: str, user=Depends(get_current_user)):
    require_admin(user)
    delete_tag(tag_id, user["access_token"])
    return {"deleted": True}
