from datetime import datetime
from pydantic import BaseModel, Field

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    assigned_to: str = Field(min_length=1)  # Supabase user id (uuid string)
    due_date: datetime | None = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    assigned_to: str
    created_by: str
    due_date: datetime | None = None
    created_at: datetime

class TaskListOut(BaseModel):
    items: list[TaskOut]
