"""
Phase 6 — Adaptive Portfolio Decision Engine (APDE) API Router
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.models.portfolio import Portfolio
from app.services.apde_engine import APDEEngine
from app.models.apde import PortfolioHealth, DecisionCard, DecisionHistory, ScenarioSimulation
from app.services.candidate_discovery_service import CandidateDiscoveryService

router = APIRouter(prefix="/apde", tags=["Adaptive Portfolio Decision Engine"])


@router.post("/analyze/{portfolio_id}")
def analyze_portfolio(portfolio_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Engine 1 — Analyze portfolio health, diversification, risk, and concentrations."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    engine = APDEEngine(db)
    return engine.calculate_portfolio_health(portfolio_id)


@router.get("/health/{portfolio_id}")
def get_portfolio_health(portfolio_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieve current portfolio health score and metrics."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    engine = APDEEngine(db)
    return engine.calculate_portfolio_health(portfolio_id)


@router.post("/recommendations/{portfolio_id}")
def generate_recommendations(portfolio_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Engines 2, 3, 5, 6, 7, 8, 12, 13 — Generate intelligent decision cards with explainability."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    engine = APDEEngine(db)
    cards = engine.generate_recommendations(portfolio_id)
    return {
        "portfolio_id": portfolio_id,
        "cards_generated": len(cards),
        "decision_cards": cards,
    }


@router.get("/cards/{portfolio_id}")
def get_decision_cards(
    portfolio_id: str,
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve decision cards for a portfolio."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    q = db.query(DecisionCard).filter(DecisionCard.portfolio_id == portfolio_id)
    if status:
        q = q.filter(DecisionCard.status == status.upper())
    rows = q.order_by(DecisionCard.created_at.desc()).all()

    if not rows:
        # Generate initial cards if empty
        engine = APDEEngine(db)
        cards = engine.generate_recommendations(portfolio_id)
        return cards

    return [
        {
            "id": r.id,
            "portfolio_id": r.portfolio_id,
            "title": r.title,
            "recommendation_type": r.recommendation_type,
            "source_asset": r.source_asset,
            "target_asset": r.target_asset,
            "reallocation_pct": r.reallocation_pct,
            "capital_amount": r.capital_amount,
            "current_allocation_pct": r.current_allocation_pct,
            "proposed_allocation_pct": r.proposed_allocation_pct,
            "expected_return_improvement": r.expected_return_improvement,
            "risk_reduction_pct": r.risk_reduction_pct,
            "confidence_score": r.confidence_score,
            "decision_score": r.decision_score,
            "why_this_stock": r.why_this_stock,
            "why_not_another": r.why_not_another,
            "why_now": r.why_now,
            "why_this_percentage": r.why_this_percentage,
            "model_used": r.model_used,
            "market_regime": r.market_regime,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.post("/cards/{card_id}/action")
def record_card_action(
    card_id: str,
    action: str = Query(..., description="ACCEPTED, REJECTED, or MODIFIED"),
    modified_pct: Optional[float] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Engine 9 — Record user decision action (ACCEPTED, REJECTED, MODIFIED)."""
    # Verify card belongs to user's portfolio
    card = db.query(DecisionCard).filter(DecisionCard.id == card_id).first()
    if not card:
        raise HTTPException(404, "Decision card not found")
    _verify_portfolio_ownership(db, card.portfolio_id, current_user.id)
    engine = APDEEngine(db)
    res = engine.record_card_action(card_id, action, str(current_user.id), modified_pct)
    if "error" in res:
        raise HTTPException(400, res["error"])
    return res


@router.post("/what-if")
def run_what_if_simulation(
    portfolio_id: str = Query(default="default_portfolio"),
    source_asset: str = Query(default="TSLA"),
    target_asset: str = Query(default="NVDA"),
    reallocation_pct: float = Query(default=0.10, ge=0.01, le=0.50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Engine 11 — Interactive manual What-If scenario simulator."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    engine = APDEEngine(db)
    return engine.run_what_if_simulation(portfolio_id, source_asset, target_asset, reallocation_pct)


@router.get("/history/{portfolio_id}")
def get_decision_history(
    portfolio_id: str,
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Engine 9 — Retrieve past decisions audit trail."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    rows = db.query(DecisionHistory).filter(
        DecisionHistory.portfolio_id == portfolio_id
    ).order_by(DecisionHistory.timestamp.desc()).limit(limit).all()

    return [
        {
            "id": r.id,
            "card_id": r.card_id,
            "action_taken": r.action_taken,
            "recommendation_type": r.recommendation_type,
            "source_asset": r.source_asset,
            "target_asset": r.target_asset,
            "reallocation_pct": r.reallocation_pct,
            "confidence_score": r.confidence_score,
            "market_regime": r.market_regime,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in rows
    ]

@router.get("/candidates/{portfolio_id}")
def discover_candidates(
    portfolio_id: str,
    candidate_type: str = Query(default="NEW_ALLOCATION", description="NEW_ALLOCATION or REPLACEMENT"),
    target_holding: Optional[str] = Query(default=None, description="Holding symbol to replace"),
    limit: int = Query(default=2, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Phase 18 — Candidate Discovery Engine (CDE) Endpoint."""
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    cde = CandidateDiscoveryService(db)
    candidates = cde.discover_candidates(
        portfolio_id=portfolio_id,
        candidate_type=candidate_type.upper(),
        target_holding=target_holding,
        top_n=limit
    )
    return {
        "portfolio_id": portfolio_id,
        "candidate_type": candidate_type.upper(),
        "candidates_discovered": len(candidates),
        "candidates": candidates
    }

@router.get("/replacement-options/{portfolio_id}")
def replacement_options(
    portfolio_id: str,
    target_holding: str = Query(..., min_length=1, description="Held symbol to review"),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return an auditable replacement shortlist with safe fallbacks.

    This endpoint deliberately does not execute trades.  It gives the UI the
    explicit decision set: hold, replace with each eligible candidate, or move
    the capital to cash when no candidate clears the evidence bar.
    """
    _verify_portfolio_ownership(db, portfolio_id, current_user.id)
    cde = CandidateDiscoveryService(db)
    candidates = cde.discover_candidates(
        portfolio_id=portfolio_id,
        candidate_type="REPLACEMENT",
        target_holding=target_holding,
        top_n=limit,
    )
    return {
        "portfolio_id": portfolio_id,
        "target_holding": target_holding,
        "options": [
            {
                "action": "HOLD",
                "ticker": target_holding,
                "score": None,
                "reasons": ["Keep the current holding when no alternative clears the improvement threshold."],
                "warnings": [],
            },
            *[
                {
                    "action": "REPLACE",
                    "ticker": row["ticker"],
                    "score": row["score"],
                    "expected_return": row["expected_return"],
                    "risk_metrics": row["risk_metrics"],
                    "diversification_metrics": row["diversification_metrics"],
                    "fundamental_quality": row["fundamental_quality"],
                    "reasons": row["reasons"],
                    "warnings": row["warnings"],
                    "source_signals": row["source_signals"],
                }
                for row in candidates
            ],
            {
                "action": "CASH",
                "ticker": "CASH",
                "score": None,
                "reasons": ["Use cash when data quality, suitability, liquidity or expected improvement is insufficient."],
                "warnings": ["Cash has an assumed risk-free return and is not a guaranteed return."],
            },
        ],
        "selection_rule": "Recommend replacement only after portfolio-level APDE optimization, costs, taxes and guardrails produce a meaningful improvement.",
    }

# ─── Admin-Only: Global Portfolio Governance ─────────────────────────────────

@router.get("/admin/portfolios/overview", dependencies=[Depends(require_admin)])
def admin_all_portfolios_overview(db: Session = Depends(get_db)):
    """Admin: List all portfolios with their latest health score, VaR, and key metrics."""
    from app.models.apde import PortfolioHealth
    from app.models.holding import Holding
    portfolios = db.query(Portfolio).all()
    result = []
    for p in portfolios:
        latest_health = (
            db.query(PortfolioHealth)
            .filter(PortfolioHealth.portfolio_id == str(p.id))
            # PortfolioHealth records use `calculated_at` as their timestamp.
            # Ordering by the non-existent legacy `created_at` column caused
            # the admin portfolio overview to return HTTP 500.
            .order_by(PortfolioHealth.calculated_at.desc())
            .first()
        )
        holding_count = db.query(Holding).filter(Holding.portfolio_id == p.id).count()
        holdings = db.query(Holding).filter(Holding.portfolio_id == p.id).all()
        total_value = sum(float(h.quantity or 0) * float(h.asset.price or 0) for h in holdings if h.asset)
        result.append({
            "portfolio_id": str(p.id),
            "portfolio_name": p.name,
            "user_id": str(p.user_id),
            "holding_count": holding_count,
            "total_value": round(total_value, 2),
            "cash_balance": 0.0,
            "risk_profile": (p.risk_level if hasattr(p, "risk_level") else None) or (latest_health.overall_health_rating if latest_health else "UNANALYZED"),
            "health_score": latest_health.health_score if latest_health else None,
            "health_rating": latest_health.overall_health_rating if latest_health else None,
            "var_95_pct": getattr(latest_health, 'historical_var_95_pct', None) if latest_health else None,
            "sharpe_ratio": latest_health.sharpe_ratio if latest_health else None,
            "max_drawdown_pct": latest_health.max_drawdown_pct if latest_health else None,
            "created_at": p.created_at.isoformat(),
        })
    return {"total_portfolios": len(result), "portfolios": result}


@router.post("/admin/portfolios/{portfolio_id}/force-analyze", dependencies=[Depends(require_admin)])
def admin_force_analyze(portfolio_id: str, db: Session = Depends(get_db)):
    """Admin: Force-run APDE health analysis and generate recommendations on any portfolio."""
    engine = APDEEngine(db)
    health = engine.calculate_portfolio_health(portfolio_id)
    cards = engine.generate_recommendations(portfolio_id)
    return {
        "portfolio_id": portfolio_id,
        "health": health,
        "cards_generated": len(cards),
        "decision_cards": cards,
    }


def _verify_portfolio_ownership(db: Session, portfolio_id: str, user_id: str):
    """Helper to verify that the current user owns the specified portfolio or auto-create primary portfolio."""
    import uuid
    from fastapi import HTTPException
    try:
        p_uuid = uuid.UUID(portfolio_id)
    except ValueError:
        p_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, str(portfolio_id))
        
    portfolio = db.query(Portfolio).filter(Portfolio.id == p_uuid).first()
    if portfolio:
        if str(portfolio.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Not authorized to access this portfolio")
    if not portfolio:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if not portfolio:
            portfolio = Portfolio(
                id=uuid.uuid4(),
                user_id=user_id,
                name="Primary AI Investment Portfolio"
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
    return portfolio
