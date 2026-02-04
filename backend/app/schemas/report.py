from datetime import date
from pydantic import BaseModel

class ReportByStaffRow(BaseModel):
    staff_id: str
    total_tasks: int
    open_tasks: int
    closed_tasks: int

class ReportByTagRow(BaseModel):
    tag: str
    total_tasks: int

class ReportFilters(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
