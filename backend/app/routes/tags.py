from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.schemas.tag import TagCreate, TagOut
from app.services.tag_service import create_tag, list_tags, delete_tag

router = APIRouter()

@router.get("", response_model=list[TagOut])
def get_tags(user=Depends(get_current_user)):
    # staff can see tags (read-only)
    return list_tags()

@router.post("", response_model=TagOut)
def post_tag(payload: TagCreate, user=Depends(get_current_user)):
    require_admin(user)
    return create_tag(payload.name)

@router.delete("/{tag_id}")
def remove_tag(tag_id: int, user=Depends(get_current_user)):
    require_admin(user)
    delete_tag(tag_id)
    return {"deleted": True}
