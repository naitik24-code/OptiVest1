import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uuid
import time

from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.exceptions import OptiVestException
from app.core.logging import logger
from app.db.session import Base, engine

# Initialize Database Schema if running outside Alembic
Base.metadata.create_all(bind=engine)

# Seed initial assets
try:
    from app.db.session import SessionLocal
    from app.repositories.asset_repository import AssetRepository
    from app.services.asset_service import AssetService
    db = SessionLocal()
    AssetService(AssetRepository(db)).seed_initial_assets()
    db.close()
except Exception as e:
    print(f"Asset seeding skipped/failed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_correlation_id_and_timing(request: Request, call_next):
    """Global request logging middleware for correlation ID and execution latency tracking."""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({process_time:.2f}ms)"
    )
    return response


@app.exception_handler(OptiVestException)
async def optivest_exception_handler(request: Request, exc: OptiVestException):
    """Custom exception handler delivering unified HTTP response envelopes."""
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            },
            "meta": {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "request_id": request_id
            }
        }
    )


@app.get("/health", tags=["Health Check"])
def health_check():
    """Health check endpoint for Docker container probes."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


# Mount Versioned API V1 Routers
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
