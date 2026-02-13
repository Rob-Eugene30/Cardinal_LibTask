from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes.health import router as health_router
from app.routes.tasks import router as tasks_router
from app.routes.status import router as status_router
from app.routes.tags import router as tags_router
from app.routes import me
from app.routes.auth import router as auth_router
from app.routes.debug import router as debug_router
from app.routes.staff import router as staff_router



def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

    origins = settings.CORS_ORIGINS

    # -----------------------------
    # API routes (all under /api)
    # -----------------------------
    app.include_router(health_router, prefix="/api")
    app.include_router(auth_router, prefix="/api", tags=["auth"])
    app.include_router(tasks_router, prefix="/api/tasks", tags=["tasks"])
    app.include_router(status_router, prefix="/api/status", tags=["status"])
    app.include_router(tags_router, prefix="/api/tags", tags=["tags"])
    app.include_router(me.router, prefix="/api", tags=["auth"])
    app.include_router(staff_router, prefix="/api", tags=["staff"])

    # Keep this for now while stabilizing
    app.include_router(debug_router, prefix="/api", tags=["debug"])

    # -----------------------------
    # Serve built frontend (SPA)
    # -----------------------------
    project_root = Path(__file__).resolve().parents[2]
    frontend_dist = project_root / "frontend" / "dist"

    if frontend_dist.exists():
        app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

        @app.get("/{full_path:path}")
        def spa_fallback(full_path: str):
            return FileResponse(frontend_dist / "index.html")

    return app


app = create_app()
