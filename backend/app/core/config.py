import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Cardinal LibTask API")
    ENV: str = os.getenv("ENV", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

    # Auth verification mode
    SUPABASE_JWT_ALG: str = os.getenv("SUPABASE_JWT_ALG", "RS256")  # RS256 recommended
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")  # required if HS256

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Token validation
    JWT_AUDIENCE: str = os.getenv("JWT_AUDIENCE", "authenticated")
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "")  # if empty, derived from SUPABASE_URL

settings = Settings()
