from app.core.errors import forbidden

def require_admin(user: dict) -> dict:
    if user.get("app_role") != "admin":
        forbidden("Admin access required.")
    return user

def require_staff_or_admin(user: dict) -> dict:
    # staff is default
    if user.get("app_role") not in ("admin", "staff"):
        forbidden("Staff access required.")
    return user
