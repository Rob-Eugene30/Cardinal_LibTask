from __future__ import annotations

from typing import Any, Dict

from fastapi import Depends

from app.core.auth import get_current_user
from app.core.errors import forbidden


def _get_db_role(user: Dict[str, Any]) -> str:
    """
    We treat db_role as the source of truth for app authorization.
    get_current_user() should already attach it (because /api/me returns it).
    """
    role = user.get("db_role")
    return str(role or "").strip().lower()


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Admin-only access.
    Uses db_role (not Supabase JWT 'role' which is often just 'authenticated').
    """
    if _get_db_role(user) != "admin":
        forbidden("Admin access required.")
    return user


def require_staff(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Staff (or admin) access. (Admin is allowed to access staff resources)
    """
    role = _get_db_role(user)
    if role not in {"staff", "admin"}:
        forbidden("Staff access required.")
    return user
