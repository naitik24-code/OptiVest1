from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.portfolios import router as portfolios_router
from app.api.v1.assets import router as assets_router
from app.api.v1.watchlists import router as watchlists_router
from app.api.v1.market import router as market_router
from app.api.v1.market_resilience import router as market_resilience_router
from app.api.v1.ai_infra import router as ai_infra_router
from app.api.v1.ml_pipeline import router as ml_pipeline_router
from app.api.v1.ai_prediction import router as ai_prediction_router
from app.api.v1.apde import router as apde_router
from app.api.v1.paper_trading import router as paper_trading_router
from app.api.v1.research_validation import router as research_validation_router
from app.api.v1.autonomous import router as autonomous_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(portfolios_router)
api_v1_router.include_router(assets_router)
api_v1_router.include_router(watchlists_router)
api_v1_router.include_router(market_router)
api_v1_router.include_router(market_resilience_router)
api_v1_router.include_router(ai_infra_router)
api_v1_router.include_router(ml_pipeline_router)
api_v1_router.include_router(ai_prediction_router)
api_v1_router.include_router(apde_router)
api_v1_router.include_router(paper_trading_router)
api_v1_router.include_router(research_validation_router)
api_v1_router.include_router(autonomous_router, prefix="/autonomous", tags=["Autonomous"])
