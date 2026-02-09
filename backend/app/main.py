from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes.health import router as health_router
from app.routes.tasks import router as tasks_router
from app.routes.status import router as status_router
from app.routes.tags import router as tags_router
from app.routes.reports import router as reports_router
from app.routes import me


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health_router)
    app.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
    app.include_router(status_router, prefix="/status", tags=["status"])
    app.include_router(tags_router, prefix="/tags", tags=["tags"])
    app.include_router(reports_router, prefix="/reports", tags=["reports"])
    app.include_router(me.router, tags=["auth"])


    return app

app = create_app()
