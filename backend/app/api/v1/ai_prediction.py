"""
Phase 5 — AI Prediction Platform API
Covers all 8 API groups:
  Train Model | Evaluate | Compare | Backtest | Predict | History | Metrics | Status
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, BackgroundTasks, Query, HTTPException
from sqlalchemy.orm import Session
import uuid, json

from app.db.session import get_db
from app.services.multi_model_trainer import MultiModelTrainer
from app.services.prediction_engine import PredictionEngine
from app.services.backtesting_engine import BacktestingEngine, BACKTEST_PERIODS
from app.services.model_evaluator import ModelEvaluator, ALGORITHMS
from app.services.ensemble_engine import EnsembleEngine
from app.services.confidence_engine import ConfidenceEngine
from app.services.dataset_builder import DatasetBuilder, DatasetConfig
from app.services.walk_forward_validator import WalkForwardValidator
from app.services.hyperparameter_optimizer import HyperparameterOptimizer
from app.services.ai_registry_service import AIRegistryService
from app.services.market_regime_detector import market_regime_detector
from app.models.ai_prediction import (
    TrainedModel, ModelMetric, PredictionHistory,
    BacktestResult, EnsembleModel, HyperparameterTrial, WalkForwardResult, MarketRegimeLog
)

from app.dependencies.auth import get_current_user
router = APIRouter(prefix="/ai", tags=["AI Prediction Engine"], dependencies=[Depends(get_current_user)])

ASSETS_DEFAULT = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]


# ════════════════════════════════════════════════════════════════════════════
# MODULE 1 — TRAINING
# ════════════════════════════════════════════════════════════════════════════

@router.post("/train")
async def train_model(
    background_tasks: BackgroundTasks,
    algorithm: str = Query(default="LSTM", description=f"One of: {', '.join(ALGORITHMS)}"),
    asset_symbol: str = Query(default="AAPL"),
    prediction_horizon: str = Query(default="5D", description="1D, 5D, 10D, 20D, 30D"),
    run_hpo: bool = Query(default=True),
    run_walk_forward: bool = Query(default=True),
    n_hpo_trials: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Train a single algorithm through the full ML pipeline."""
    algo = algorithm.upper()
    if algo not in [a.upper() for a in ALGORITHMS]:
        raise HTTPException(400, f"Algorithm '{algo}' not supported. Choose from: {ALGORITHMS}")

    registry = AIRegistryService(db)
    job_name = f"{algo}_{asset_symbol}_{prediction_horizon}_{str(uuid.uuid4())[:8]}"
    job = registry.enqueue_training_job(job_name, "TRAINING", algo, "v1.0.0", "v1.0.0")
    queue_id = job["id"]

    background_tasks.add_task(
        MultiModelTrainer.train_single,
        queue_id=queue_id, algorithm=algo,
        asset_symbol=asset_symbol, prediction_horizon=prediction_horizon,
        run_hpo=run_hpo, run_walk_forward=run_walk_forward, n_hpo_trials=n_hpo_trials,
    )
    return {
        "status": "DISPATCHED",
        "job_name": job_name,
        "queue_id": queue_id,
        "algorithm": algo,
        "asset_symbol": asset_symbol,
        "prediction_horizon": prediction_horizon,
        "pipeline_stages": [s[0] for s in __import__(
            "app.services.multi_model_trainer", fromlist=["TRAINING_STAGES"]
        ).TRAINING_STAGES],
    }


@router.post("/train/all")
async def train_all_algorithms(
    background_tasks: BackgroundTasks,
    asset_symbol: str = Query(default="AAPL"),
    prediction_horizon: str = Query(default="5D"),
    db: Session = Depends(get_db),
):
    """Dispatch training jobs for ALL 7 algorithms simultaneously."""
    registry = AIRegistryService(db)
    queue_ids = {}
    for algo in ALGORITHMS:
        job_name = f"{algo}_{asset_symbol}_{prediction_horizon}_{str(uuid.uuid4())[:8]}"
        job = registry.enqueue_training_job(job_name, "TRAINING", algo, "v1.0.0", "v1.0.0")
        queue_ids[algo] = job["id"]
        background_tasks.add_task(
            MultiModelTrainer.train_single,
            queue_id=job["id"], algorithm=algo,
            asset_symbol=asset_symbol, prediction_horizon=prediction_horizon,
        )
    return {
        "status": "ALL_DISPATCHED",
        "algorithms": ALGORITHMS,
        "asset_symbol": asset_symbol,
        "prediction_horizon": prediction_horizon,
        "queue_ids": queue_ids,
        "total_jobs": len(ALGORITHMS),
    }


@router.get("/models")
def list_trained_models(
    asset_symbol: Optional[str] = Query(default=None),
    algorithm: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """List all trained models with metrics."""
    q = db.query(TrainedModel).order_by(TrainedModel.created_at.desc())
    if asset_symbol:
        q = q.filter(TrainedModel.asset_symbol == asset_symbol)
    if algorithm:
        q = q.filter(TrainedModel.algorithm == algorithm.upper())
    if status:
        q = q.filter(TrainedModel.status == status.upper())
    return MultiModelTrainer.get_trained_models(db, asset_symbol)


@router.get("/models/{model_id}")
def get_model_detail(model_id: str, db: Session = Depends(get_db)):
    """Get full model detail including all metrics."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(404, "Model not found")
    metrics = [
        {
            "evaluation_set": m.evaluation_set,
            "rmse": m.rmse, "mae": m.mae, "mape": m.mape,
            "r_squared": m.r_squared, "directional_accuracy": m.directional_accuracy,
            "precision": m.precision, "recall": m.recall, "f1_score": m.f1_score,
            "hit_ratio": m.hit_ratio, "sharpe_ratio": m.sharpe_ratio,
            "max_drawdown": m.max_drawdown, "annualized_return": m.annualized_return,
            "prediction_latency_ms": m.prediction_latency_ms,
            "training_time_s": m.training_time_s,
            "train_loss_curve": json.loads(m.train_loss_curve or "[]"),
            "val_loss_curve": json.loads(m.val_loss_curve or "[]"),
            "feature_importance": json.loads(m.feature_importance or "{}"),
        }
        for m in model.metrics
    ]
    return {
        "id": model.id, "name": model.name, "algorithm": model.algorithm,
        "version": model.version, "asset_symbol": model.asset_symbol,
        "prediction_horizon": model.prediction_horizon, "status": model.status,
        "is_champion": model.is_champion, "hyperparameters": json.loads(model.hyperparameters or "{}"),
        "training_duration_s": model.training_duration_s,
        "inference_latency_ms": model.inference_latency_ms,
        "metrics": metrics,
        "created_at": model.created_at.isoformat() if model.created_at else None,
        "trained_at": model.trained_at.isoformat() if model.trained_at else None,
    }


@router.post("/models/elect-champion")
def elect_champion(db: Session = Depends(get_db)):
    """Elect the best-performing model as champion."""
    champion_id = MultiModelTrainer.elect_champion(db)
    if champion_id:
        return {"champion_model_id": champion_id, "status": "CHAMPION_ELECTED"}
    return {"status": "NO_ACTIVE_MODELS"}


# ════════════════════════════════════════════════════════════════════════════
# MODULE 5 — EVALUATION
# ════════════════════════════════════════════════════════════════════════════

@router.get("/evaluate/{model_id}")
def evaluate_model(model_id: str, db: Session = Depends(get_db)):
    """Get evaluation report for a specific trained model."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(404, "Model not found")
    return ModelEvaluator.generate_evaluation_report(
        model.id, model.algorithm, model.training_duration_s, model.asset_symbol or "GENERAL"
    )


@router.get("/evaluate/compare/all")
def compare_all_models(
    asset_symbol: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Compare all trained models ranked by directional accuracy."""
    models = MultiModelTrainer.get_trained_models(db, asset_symbol)
    if not models:
        # Return simulated comparison if no models trained yet
        return {
            "comparison": ModelEvaluator.rank_models([
                ModelEvaluator.evaluate(f"SIM_{a}", a, seed=i)
                for i, a in enumerate(ALGORITHMS)
            ]),
            "source": "SIMULATED",
        }
    ranked = sorted(models, key=lambda m: m.get("directional_accuracy") or 0, reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1
    return {"comparison": ranked, "total": len(ranked), "source": "TRAINED_MODELS"}


# ════════════════════════════════════════════════════════════════════════════
# MODULE 8 — PREDICTION
# ════════════════════════════════════════════════════════════════════════════

@router.get("/predict")
@router.post("/predict")
def generate_prediction(
    asset_symbol: str = Query(default="AAPL"),
    prediction_horizon: str = Query(default="5D"),
    algorithm: str = Query(default="LSTM"),
    db: Session = Depends(get_db),
):
    """Generate a single confidence-scored prediction."""
    engine = PredictionEngine(db)
    return engine.generate_prediction(asset_symbol, prediction_horizon, algorithm)


@router.get("/predict/multi-model")
@router.post("/predict/multi-model")
def multi_model_prediction(
    asset_symbol: str = Query(default="AAPL"),
    prediction_horizon: str = Query(default="5D"),
    db: Session = Depends(get_db),
):
    """Run all algorithms and return ensemble prediction."""
    engine = PredictionEngine(db)
    return engine.multi_model_predict(asset_symbol, prediction_horizon)


@router.get("/predict/batch")
def batch_prediction(
    assets: str = Query(default="AAPL,MSFT,GOOGL,AMZN,NVDA"),
    prediction_horizon: str = Query(default="5D"),
    algorithm: str = Query(default="LSTM"),
    db: Session = Depends(get_db),
):
    """Generate predictions for multiple assets."""
    asset_list = [a.strip().upper() for a in assets.split(",")]
    engine = PredictionEngine(db)
    return {
        "predictions": engine.batch_predict(asset_list, prediction_horizon, algorithm),
        "total": len(asset_list),
        "algorithm": algorithm,
        "prediction_horizon": prediction_horizon,
    }


# ════════════════════════════════════════════════════════════════════════════
# MODULE 11 — PREDICTION HISTORY
# ════════════════════════════════════════════════════════════════════════════

@router.get("/predictions/history")
def get_prediction_history(
    asset_symbol: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve stored prediction history with outcomes."""
    engine = PredictionEngine(db)
    return {
        "predictions": engine.get_prediction_history(asset_symbol, limit),
        "total": limit,
    }


@router.get("/predictions/stats")
def prediction_stats(db: Session = Depends(get_db)):
    """Aggregate prediction statistics."""
    total = db.query(PredictionHistory).count()
    resolved = db.query(PredictionHistory).filter(PredictionHistory.is_resolved == True).count()
    correct = db.query(PredictionHistory).filter(PredictionHistory.outcome == "CORRECT").count()
    accuracy = round(correct / max(resolved, 1), 4)
    avg_conf = db.query(PredictionHistory).with_entities(
        __import__("sqlalchemy", fromlist=["func"]).func.avg(PredictionHistory.confidence_score)
    ).scalar() or 0.0
    return {
        "total_predictions": total,
        "resolved_predictions": resolved,
        "correct_predictions": correct,
        "overall_accuracy": accuracy,
        "average_confidence": round(float(avg_conf), 4),
    }


# ════════════════════════════════════════════════════════════════════════════
# MODULE 9 — BACKTESTING
# ════════════════════════════════════════════════════════════════════════════

@router.get("/backtest/{model_id}")
def run_backtest(
    model_id: str,
    period: str = Query(default="1Y"),
    db: Session = Depends(get_db),
):
    """Run backtest for a specific model."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(404, "Model not found")
    result = BacktestingEngine.run_backtest(
        model.id, model.algorithm, model.asset_symbol or "AAPL", period
    )
    # Persist result
    try:
        row = BacktestResult(
            id=str(uuid.uuid4()), model_id=model.id,
            asset_symbol=model.asset_symbol or "AAPL",
            backtest_period=period,
            start_date=result["start_date"], end_date=result["end_date"],
            total_predictions=result["total_predictions"],
            total_return_pct=result["total_return_pct"],
            annualized_return_pct=result["annualized_return_pct"],
            hit_ratio=result["hit_ratio"],
            directional_accuracy=result["directional_accuracy"],
            sharpe_ratio=result["sharpe_ratio"],
            max_drawdown_pct=result["max_drawdown_pct"],
            rmse=result["rmse"], mae=result["mae"], mape=result["mape"],
            max_error=result["max_error"], win_rate=result["win_rate"],
            profit_factor=result["profit_factor"],
            monthly_returns=json.dumps(result["monthly_returns"]),
            equity_curve=json.dumps(result["equity_curve"]),
            prediction_vs_actual=json.dumps(result["prediction_vs_actual"]),
        )
        db.add(row)
        db.commit()
    except Exception:
        db.rollback()
    return result


@router.get("/backtest/{model_id}/multi-period")
def run_multi_period_backtest(model_id: str, db: Session = Depends(get_db)):
    """Run backtests across all periods: 1M, 3M, 6M, 1Y."""
    model = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not model:
        raise HTTPException(404, "Model not found")
    return BacktestingEngine.run_multi_period(
        model.id, model.algorithm, model.asset_symbol or "AAPL"
    )


@router.get("/backtest/compare/algorithms")
def compare_algorithms_backtest(
    asset_symbol: str = Query(default="AAPL"),
    period: str = Query(default="1Y"),
):
    """Backtest all algorithms for comparison."""
    return {
        "asset_symbol": asset_symbol,
        "period": period,
        "results": BacktestingEngine.compare_algorithms(ALGORITHMS, asset_symbol, period),
    }


@router.get("/backtest/results/all")
def all_backtest_results(
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    """List all stored backtest results."""
    rows = db.query(BacktestResult).order_by(BacktestResult.run_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id, "model_id": r.model_id, "asset_symbol": r.asset_symbol,
            "backtest_period": r.backtest_period,
            "hit_ratio": r.hit_ratio, "sharpe_ratio": r.sharpe_ratio,
            "total_return_pct": r.total_return_pct, "max_drawdown_pct": r.max_drawdown_pct,
            "run_at": r.run_at.isoformat() if r.run_at else None,
        }
        for r in rows
    ]


# ════════════════════════════════════════════════════════════════════════════
# MODULE 6 — ENSEMBLE
# ════════════════════════════════════════════════════════════════════════════

@router.post("/ensemble/create")
def create_ensemble(
    asset_symbol: str = Query(default="AAPL"),
    prediction_horizon: str = Query(default="5D"),
    ensemble_type: str = Query(default="WEIGHTED_AVERAGE"),
    db: Session = Depends(get_db),
):
    """Create an ensemble from all active trained models."""
    models = db.query(TrainedModel).filter(TrainedModel.status == "ACTIVE").all()
    if len(models) < 2:
        return {"error": "Need at least 2 active trained models to create an ensemble."}

    member_ids = [m.id for m in models]
    individual_metrics = []
    for m in models:
        test_m = next((x for x in m.metrics if x.evaluation_set == "TEST"), None)
        if test_m:
            individual_metrics.append({
                "model_id": m.id,
                "algorithm": m.algorithm,
                "directional_accuracy": test_m.directional_accuracy,
                "rmse": test_m.rmse,
                "sharpe_ratio": test_m.sharpe_ratio,
            })

    weights = EnsembleEngine.compute_optimal_weights(individual_metrics)
    ens_metrics = EnsembleEngine.simulate_ensemble_metrics(member_ids, individual_metrics, ensemble_type)
    ensemble_name = f"ENSEMBLE_{ensemble_type}_{asset_symbol}_{str(uuid.uuid4())[:6]}"
    ensemble_id = str(uuid.uuid4())

    report = EnsembleEngine.build_ensemble_report(
        ensemble_id, ensemble_name, ensemble_type, member_ids, weights,
        ens_metrics, individual_metrics
    )

    # Persist
    try:
        row = EnsembleModel(
            id=ensemble_id, name=ensemble_name, ensemble_type=ensemble_type,
            member_model_ids=json.dumps(member_ids), member_weights=json.dumps(weights),
            asset_symbol=asset_symbol, prediction_horizon=prediction_horizon,
            ensemble_directional_accuracy=ens_metrics.get("directional_accuracy", 0),
            best_individual_accuracy=report["best_individual_accuracy"],
            improvement_pct=report["improvement_pct"],
            is_champion=(report["champion"] == "ENSEMBLE"),
        )
        db.add(row)
        db.commit()
    except Exception:
        db.rollback()

    return report


@router.get("/ensemble/list")
def list_ensembles(db: Session = Depends(get_db)):
    rows = db.query(EnsembleModel).order_by(EnsembleModel.created_at.desc()).all()
    return [
        {
            "id": r.id, "name": r.name, "ensemble_type": r.ensemble_type,
            "asset_symbol": r.asset_symbol, "n_members": len(json.loads(r.member_model_ids or "[]")),
            "ensemble_directional_accuracy": r.ensemble_directional_accuracy,
            "improvement_pct": r.improvement_pct, "is_champion": r.is_champion,
        }
        for r in rows
    ]


# ════════════════════════════════════════════════════════════════════════════
# MODULE 4 — HYPERPARAMETER OPTIMIZATION
# ════════════════════════════════════════════════════════════════════════════

@router.post("/hpo/run")
def run_hpo(
    algorithm: str = Query(default="LSTM"),
    strategy: str = Query(default="RANDOM"),
    n_trials: int = Query(default=10, ge=1, le=100),
    asset_symbol: str = Query(default="AAPL"),
    db: Session = Depends(get_db),
):
    """Run hyperparameter optimization and store all trials."""
    algo = algorithm.upper()
    optimizer = HyperparameterOptimizer(algo, strategy, n_trials)
    experiment_name = f"HPO_{algo}_{asset_symbol}_{str(uuid.uuid4())[:8]}"
    result = optimizer.generate_trials(experiment_name)

    for t in result.get("trials", []):
        row = HyperparameterTrial(
            id=str(uuid.uuid4()), experiment_name=experiment_name, algorithm=algo,
            search_strategy=strategy.upper(), trial_number=t["trial_number"],
            hyperparameters=json.dumps(t["hyperparameters"]),
            objective_value=t["objective_value"], directional_accuracy=t["directional_accuracy"],
            rmse=t["rmse"], training_time_s=t["training_time_s"],
            status=t["status"], is_best=t["is_best"],
        )
        db.add(row)
    try:
        db.commit()
    except Exception:
        db.rollback()
    return result


@router.get("/hpo/trials")
def list_hpo_trials(
    algorithm: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(HyperparameterTrial).order_by(HyperparameterTrial.created_at.desc())
    if algorithm:
        q = q.filter(HyperparameterTrial.algorithm == algorithm.upper())
    rows = q.limit(limit).all()
    return [
        {
            "id": r.id, "experiment_name": r.experiment_name, "algorithm": r.algorithm,
            "strategy": r.search_strategy, "trial_number": r.trial_number,
            "hyperparameters": json.loads(r.hyperparameters or "{}"),
            "objective_value": r.objective_value, "directional_accuracy": r.directional_accuracy,
            "rmse": r.rmse, "is_best": r.is_best,
        }
        for r in rows
    ]


# ════════════════════════════════════════════════════════════════════════════
# MODULE 3 — WALK-FORWARD VALIDATION
# ════════════════════════════════════════════════════════════════════════════

@router.get("/walk-forward/{model_id}")
def get_walk_forward_results(model_id: str, db: Session = Depends(get_db)):
    rows = db.query(WalkForwardResult).filter(
        WalkForwardResult.model_id == model_id
    ).order_by(WalkForwardResult.fold_number).all()
    return [
        {
            "fold": r.fold_number, "type": r.validation_type,
            "train_start": r.train_start, "train_end": r.train_end,
            "test_start": r.test_start, "test_end": r.test_end,
            "train_samples": r.train_samples, "test_samples": r.test_samples,
            "rmse": r.rmse, "mae": r.mae, "mape": r.mape,
            "r_squared": r.r_squared, "directional_accuracy": r.directional_accuracy,
            "sharpe_ratio": r.sharpe_ratio, "hit_ratio": r.hit_ratio,
        }
        for r in rows
    ]


@router.post("/walk-forward/simulate")
def simulate_walk_forward(
    algorithm: str = Query(default="LSTM"),
    n_folds: int = Query(default=5, ge=2, le=10),
    mode: str = Query(default="WALK_FORWARD"),
):
    """Simulate walk-forward validation for a given algorithm (no model required)."""
    from app.services.dataset_builder import _date_range
    all_dates = _date_range("2020-01-01", "2026-06-30")
    folds = WalkForwardValidator.generate_folds(all_dates, n_splits=n_folds, mode=mode)
    fold_results = [WalkForwardValidator.simulate_fold_metrics(f, algorithm) for f in folds]
    return WalkForwardValidator.aggregate_fold_report(fold_results)


# ════════════════════════════════════════════════════════════════════════════
# MODULE 12 — AI ENGINEERING DASHBOARD
# ════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
def ai_dashboard(db: Session = Depends(get_db)):
    """Full AI Engineering Dashboard — Module 12."""
    from app.services.ai_registry_service import AIRegistryService
    from sqlalchemy import func

    registry = AIRegistryService(db)
    readiness = registry.get_ai_readiness_dashboard()
    jobs = registry.list_training_jobs()

    # Trained models
    total_models = db.query(TrainedModel).count()
    active_models = db.query(TrainedModel).filter(TrainedModel.status == "ACTIVE").count()
    champion = db.query(TrainedModel).filter(TrainedModel.is_champion == True).first()

    # Predictions
    total_preds = db.query(PredictionHistory).count()
    correct_preds = db.query(PredictionHistory).filter(PredictionHistory.outcome == "CORRECT").count()
    avg_conf = db.query(
        func.avg(PredictionHistory.confidence_score)
    ).scalar() or 0.0

    avg_da_row = db.query(
        func.avg(ModelMetric.directional_accuracy)
    ).filter(ModelMetric.evaluation_set == "TEST").scalar() or 0.0

    # HPO
    total_trials = db.query(HyperparameterTrial).count()

    # Queue summary
    running_jobs = [j for j in jobs if j["status"] == "RUNNING"]
    completed_jobs = [j for j in jobs if j["status"] == "COMPLETED"]
    failed_jobs = [j for j in jobs if j["status"] == "FAILED"]
    queued_jobs = [j for j in jobs if j["status"] in ("QUEUED", "PENDING")]

    # Latest experiments
    latest_trials = db.query(HyperparameterTrial).order_by(
        HyperparameterTrial.created_at.desc()
    ).limit(5).all()

    return {
        "phase": "PHASE_5_AI_PREDICTION_PLATFORM",
        "registered_models": {
            "total": total_models,
            "active": active_models,
            "champion": {
                "id": champion.id if champion else None,
                "name": champion.name if champion else None,
                "algorithm": champion.algorithm if champion else None,
            } if champion else None,
        },
        "training_queue": {
            "total_jobs": len(jobs),
            "running": len(running_jobs),
            "completed": len(completed_jobs),
            "failed": len(failed_jobs),
            "queued": len(queued_jobs),
            "running_jobs": running_jobs[:3],
            "completed_jobs": completed_jobs[-3:],
            "failed_jobs": failed_jobs[-3:],
        },
        "prediction_engine": {
            "total_predictions": total_preds,
            "correct_predictions": correct_preds,
            "average_accuracy": round(correct_preds / max(total_preds, 1), 4),
            "average_confidence": round(float(avg_conf), 4),
        },
        "model_performance": {
            "average_directional_accuracy": round(float(avg_da_row), 4),
            "total_hpo_trials": total_trials,
        },
        "ai_readiness": {
            "score": readiness["ai_readiness_score"],
            "status": readiness["readiness_status"],
        },
        "latest_experiments": [
            {
                "experiment_name": t.experiment_name,
                "algorithm": t.algorithm,
                "strategy": t.search_strategy,
                "best_da": t.directional_accuracy,
                "is_best": t.is_best,
            }
            for t in latest_trials
        ],
    }


# ════════════════════════════════════════════════════════════════════════════
# MODULE 15 — MARKET REGIME DETECTION
# ════════════════════════════════════════════════════════════════════════════

@router.get("/regime/detect")
def detect_market_regime(
    asset_symbol: str = Query(default="AAPL"),
    db: Session = Depends(get_db),
):
    """Detect current market regime for an asset and log result."""
    res = market_regime_detector.detect_regime(asset_symbol)
    try:
        log = MarketRegimeLog(
            id=str(uuid.uuid4()),
            asset_symbol=asset_symbol,
            regime=res["regime"],
            regime_confidence=res["regime_confidence"],
            volatility_annualized=res["volatility_annualized"],
            total_return_pct=res["total_return_pct"],
            trend_slope=res["trend_slope"],
            sma_20_ratio=res["sma_20_ratio"],
            recommended_algos=json.dumps(res["recommended_algorithms"]),
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
    return res


@router.get("/regime/history")
def get_market_regime_history(
    asset_symbol: Optional[str] = Query(default=None),
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical market regime detection logs."""
    q = db.query(MarketRegimeLog).order_by(MarketRegimeLog.detected_at.desc())
    if asset_symbol:
        q = q.filter(MarketRegimeLog.asset_symbol == asset_symbol.upper())
    rows = q.limit(limit).all()
    return [
        {
            "id": r.id,
            "asset_symbol": r.asset_symbol,
            "regime": r.regime,
            "regime_confidence": r.regime_confidence,
            "volatility_annualized": r.volatility_annualized,
            "total_return_pct": r.total_return_pct,
            "trend_slope": r.trend_slope,
            "sma_20_ratio": r.sma_20_ratio,
            "recommended_algorithms": json.loads(r.recommended_algos or "[]"),
            "detected_at": r.detected_at.isoformat() if r.detected_at else None,
        }
        for r in rows
    ]

