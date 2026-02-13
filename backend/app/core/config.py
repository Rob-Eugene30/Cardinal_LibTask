import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Always load backend/.env (avoid accidentally loading some other .env)
BACKEND_DIR = Path(__file__).resolve().parents[2]  # .../backend
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)


def _parse_cors(origins: str) -> List[str]:
    """
    Convert comma-separated CORS string into list.
    Example:
        "http://localhost:5173,http://localhost:3000"
        -> ["http://localhost:5173", "http://localhost:3000"]
    """
    if not origins:
        return []
    return [o.strip() for o in origins.split(",") if o.strip()]


@dataclass(frozen=True)
class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Cardinal LibTask API")
    ENV: str = os.getenv("ENV", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # CORS
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "")
    CORS_ORIGINS: List[str] = field(
        default_factory=lambda: _parse_cors(os.getenv("CORS_ORIGINS", ""))
    )

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

    # Token validation
    JWT_AUDIENCE: str = os.getenv("JWT_AUDIENCE", "authenticated")
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "")

    # Option A: allow this env var to exist and be read
    SUPABASE_JWT_ALG: str = os.getenv("SUPABASE_JWT_ALG", "")


settings = Settings()
