from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.core.roles import require_admin
from app.schemas.task import TaskCreate, TaskOut, TaskListOut
from app.services.task_service import (
    list_tasks, get_task, create_task, set_task_tags, update_task_basic
)

router = APIRouter()

class TaskTagUpdate(BaseModel):
    tag_ids: list[str]

class TaskPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = None
    assigned_to: str | None = None
    status: str | None = None

@router.get("", response_model=TaskListOut)
def get_tasks(user=Depends(get_current_user)):
    return {"items": list_tasks(user)}

@router.post("", response_model=TaskOut)
def post_task(payload: TaskCreate, user=Depends(get_current_user)):
    require_admin(user)
    return create_task(payload.model_dump(), user)

@router.get("/{task_id}", response_model=TaskOut)
def get_task_detail(task_id: str, user=Depends(get_current_user)):
    return get_task(task_id, user)

@router.patch("/{task_id}", response_model=TaskOut)
def patch_task(task_id: str, payload: TaskPatch, user=Depends(get_current_user)):
    require_admin(user)
    patch = {k: v for k, v in payload.model_dump().items() if v is not None}
    return update_task_basic(task_id, patch, user)

@router.put("/{task_id}/tags")
def put_task_tags(task_id: str, payload: TaskTagUpdate, user=Depends(get_current_user)):
    require_admin(user)
    return set_task_tags(task_id, payload.tag_ids, user)
