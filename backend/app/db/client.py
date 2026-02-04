from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, Result

from app.core.config import settings
from app.core.errors import bad_request

_engine: Engine | None = None

def get_engine() -> Engine:
    global _engine
    if _engine is not None:
        return _engine

    if not settings.DATABASE_URL:
        bad_request("DATABASE_URL is not configured.")
    _engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)
    return _engine

def execute(sql: str, params: dict | None = None) -> Result:
    engine = get_engine()
    with engine.begin() as conn:
        return conn.execute(text(sql), params or {})

def fetch_all(sql: str, params: dict | None = None) -> list[dict]:
    res = execute(sql, params)
    return [dict(r._mapping) for r in res.fetchall()]

def fetch_one(sql: str, params: dict | None = None) -> dict | None:
    res = execute(sql, params)
    row = res.first()
    return dict(row._mapping) if row else None
