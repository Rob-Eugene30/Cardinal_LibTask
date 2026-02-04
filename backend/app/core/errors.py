from fastapi import HTTPException

def http_error(status_code: int, code: str, message: str):
    raise HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message}},
    )

def unauthorized(message: str = "Unauthorized"):
    http_error(401, "UNAUTHORIZED", message)

def forbidden(message: str = "Forbidden"):
    http_error(403, "FORBIDDEN", message)

def not_found(message: str = "Not found"):
    http_error(404, "NOT_FOUND", message)

def bad_request(message: str = "Bad request"):
    http_error(400, "BAD_REQUEST", message)
