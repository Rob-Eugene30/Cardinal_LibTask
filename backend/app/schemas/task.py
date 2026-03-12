from datetime import date, datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    assigned_to: str = Field(min_length=1)
    due_date: date | None = None
    priority: str = Field(default="Medium")


class TaskOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    assigned_to: str
    created_by: str
    due_date: date | None = None
    priority: str = "Medium"
    status: str
    created_at: datetime
    updated_at: datetime | None = None


class TaskListOut(BaseModel):
    items: list[TaskOut]