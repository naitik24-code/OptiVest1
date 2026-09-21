"""
Phase 8 — Enterprise AI Validation & Research Engine API Router
Exposes RESTful endpoints for benchmark runs, performance validation,
strategy comparison, explainability, academic formatting, model drift, and exports.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.research_validation_service import ResearchValidationService

from app.dependencies.auth import require_admin

router = APIRouter(prefix="/research-validation", tags=["AI Validation & Research Engine"], dependencies=[Depends(require_admin)])


@router.post("/run-benchmark")
def run_benchmark_comparison(user_id: str = "default_user", db: Session = Depends(get_db)):
    """Runs benchmark comparison against Buy & Hold, S&P 500, Nifty 50, Sensex, and Nasdaq."""
    service = ResearchValidationService(db)
    return service.run_benchmark_comparison(user_id)


@router.post("/run-validation")
def run_performance_validation(db: Session = Depends(get_db)):
    """Evaluates institutional metrics: Alpha, Beta, Sharpe, Sortino, Calmar, Treynor, Win Rate."""
    service = ResearchValidationService(db)
    return service.run_performance_validation()


@router.get("/strategy-comparison")
def get_strategy_comparison(time_horizon: str = Query("3Y", description="1Y, 3Y, 5Y, 10Y"), db: Session = Depends(get_db)):
    """Compares AI Strategy against Buy & Hold, Equal Weight, Sector Allocation, and Random Walking."""
    service = ResearchValidationService(db)
    return service.get_strategy_comparison(time_horizon)


@router.get("/explainability-report/{decision_id}")
def get_explainability_report(decision_id: str = "sample_decision", db: Session = Depends(get_db)):
    """Generates complete XAI explanation narrative with indicators and feature importance."""
    service = ResearchValidationService(db)
    return service.generate_explainability_report(decision_id)


@router.get("/academic-report")
def get_academic_research_data(db: Session = Depends(get_db)):
    """Returns publication-ready LaTeX tables, t-statistics, and empirical conclusions."""
    service = ResearchValidationService(db)
    return service.get_academic_research_data()


@router.get("/model-drift")
def get_model_drift_telemetry(db: Session = Depends(get_db)):
    """Monitors model health, feature drift (PSI), and accuracy decay."""
    service = ResearchValidationService(db)
    return service.get_model_drift_telemetry()


@router.get("/export")
def export_research_report(export_format: str = Query("markdown", description="pdf, csv, markdown"), db: Session = Depends(get_db)):
    """Exports research validation report in Markdown, CSV, or PDF format."""
    service = ResearchValidationService(db)
    return service.export_research_report(export_format)
