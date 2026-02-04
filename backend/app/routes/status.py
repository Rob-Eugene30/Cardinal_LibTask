from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.services.status_service import add_status_update, list_status_updates

router = APIRouter()

class StatusUpdateIn(BaseModel):
    task_id: int
    status: str = Field(min_length=1, max_length=40)
    note: str | None = Field(default=None, max_length=1000)

@router.post("")
def post_status(payload: StatusUpdateIn, user=Depends(get_current_user)):
    return add_status_update(payload.task_id, payload.status, payload.note, user)

@router.get("/{task_id}")
def get_status(task_id: int, user=Depends(get_current_user)):
    return {"items": list_status_updates(task_id, user)}
