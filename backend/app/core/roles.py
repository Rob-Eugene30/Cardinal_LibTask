from fastapi import Depends

from app.core.auth import get_current_user
from app.core.errors import unauthorized


def require_admin(user=Depends(get_current_user)):
    role = user.get("app_role")
    if role != "admin":
        unauthorized("Admin access required.")
    return user


def require_staff(user=Depends(get_current_user)):
    role = user.get("app_role")
    if role not in ("staff", "admin"):
        unauthorized("Staff access required.")
    return user
