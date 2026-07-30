from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.portfolios import router as portfolios_router
from app.api.v1.assets import router as assets_router
from app.api.v1.watchlists import router as watchlists_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(portfolios_router)
api_v1_router.include_router(assets_router)
api_v1_router.include_router(watchlists_router)
