from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.schemas.task import TaskCreate, TaskOut, TaskListOut
from app.services.task_service import create_task, get_task, list_tasks, set_task_tags

router = APIRouter()

class TaskTagUpdate(BaseModel):
    tag_ids: list[int]

@router.get("", response_model=TaskListOut)
def get_tasks(user=Depends(get_current_user)):
    return {"items": list_tasks(user)}

@router.post("", response_model=TaskOut)
def post_task(payload: TaskCreate, user=Depends(get_current_user)):
    require_admin(user)
    return create_task(payload.model_dump(), user)

@router.get("/{task_id}", response_model=TaskOut)
def get_task_detail(task_id: int, user=Depends(get_current_user)):
    return get_task(task_id, user)

@router.put("/{task_id}/tags")
def put_task_tags(task_id: int, payload: TaskTagUpdate, user=Depends(get_current_user)):
    set_task_tags(task_id, payload.tag_ids, user)
    return {"updated": True}
