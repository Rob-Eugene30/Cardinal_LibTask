from pydantic import BaseModel

class UserOut(BaseModel):
    sub: str | None = None
    email: str | None = None
    app_role: str = "staff"
