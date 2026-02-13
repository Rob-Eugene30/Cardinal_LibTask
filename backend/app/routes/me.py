from fastapi import APIRouter, Depends

from app.core.auth import get_current_user

router = APIRouter()


@router.get("/me")
def me(user=Depends(get_current_user)):
    # Frontend trusts this value; backend resolves it (JWT -> DB fallback).
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "app_role": user.get("app_role"),
        "jwt_role": user.get("jwt_role"),
        "db_role": user.get("db_role"),
    }
