from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

db_url = settings.DATABASE_URL
engine_kwargs = {"pool_pre_ping": True}

if "postgresql" in db_url:
    try:
        import psycopg2
        host = settings.POSTGRES_HOST
        port = settings.POSTGRES_PORT
        user = settings.POSTGRES_USER
        password = settings.POSTGRES_PASSWORD
        dbname = settings.POSTGRES_DB
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname, connect_timeout=2)
        conn.close()
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20
    except Exception:
        # Fallback to local SQLite database when PostgreSQL container is not running locally
        db_url = "sqlite:///./optivest_dev.db"
        engine_kwargs = {"connect_args": {"check_same_thread": False}}

engine = create_engine(
    db_url,
    echo=(settings.ENVIRONMENT == "development"),
    **engine_kwargs
)

# Create SessionLocal Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for ORM Models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for providing a transactional database session scope per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
