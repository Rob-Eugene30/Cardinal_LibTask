from datetime import datetime

from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)


class TagOut(BaseModel):
    id: str
    name: str
    created_at: datetime | None = None
