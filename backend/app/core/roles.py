from __future__ import annotations

from typing import Any, Dict

from fastapi import Depends

from app.core.auth import get_current_user
from app.core.errors import forbidden


def _get_effective_role(user: Dict[str, Any]) -> str:
    """
    Use the backend-resolved effective role first.
    Fallback to db_role, then jwt/app_role if needed.
    """
    for key in ("app_role", "db_role", "jwt_role"):
        role = user.get(key)
        if isinstance(role, str) and role.strip():
            return role.strip().lower()
    return ""


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if _get_effective_role(user) != "admin":
        forbidden("Admin access required.")
    return user


def require_staff(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = _get_effective_role(user)
    if role not in {"staff", "admin"}:
        forbidden("Staff access required.")
    return user