from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/me")
def me(user=Depends(get_current_user)):
    """
    Returns the authenticated user's identity info + claims.
    Useful for quickly verifying auth in Swagger.
    """
    return {
        "user_id": user.get("sub"),
        "email": user.get("email"),
        "app_role": user.get("app_role"),
        "claims": user.get("claims"),
    }
