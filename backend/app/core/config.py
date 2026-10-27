import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "OptiVest AI Engine"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PORT: int = 8000

    # Portfolio policy defaults.  These are configurable per deployment; the
    # APDE still receives the user's suitability profile before optimizing.
    APDE_TAX_RATE: float = 0.20
    APDE_MAX_ASSET_WEIGHT: float = 0.20
    APDE_MAX_TURNOVER: float = 0.15

    # PostgreSQL Database Connection
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_password_dev"
    POSTGRES_DB: str = "optivest_db"
    POSTGRES_HOST: str = "database"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql://postgres:postgres_password_dev@database:5432/optivest_db"

    # JWT Authentication & Security
    JWT_SECRET: str = "super_secret_jwt_key_change_in_production_environment_32chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Allowed Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:80"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
