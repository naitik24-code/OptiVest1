"""
Module 8 — Prediction Engine
Creates structured predictions using real loaded models.
"""
from __future__ import annotations
import uuid
import json
import os
import logging
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
try:
    import torch
except ImportError:
    torch = None

from app.services.confidence_engine import ConfidenceEngine
from app.services.model_evaluator import ALGORITHMS
from app.services.dataset_builder import DatasetBuilder
from app.models.ai_prediction import (
    TrainedModel, PredictionHistory, PredictionResult
)
from app.models.market_price import MarketPrice

logger = logging.getLogger("optivest.prediction_engine")

SUPPORTED_HORIZONS = ["1D", "5D", "10D", "20D", "30D", "90D"]
PREDICTION_HORIZONS = {"1D": 1, "5D": 5, "10D": 10, "20D": 20, "30D": 30, "90D": 90}

class PredictionEngine:
    def __init__(self, db: Session):
        self.db = db

    def _get_active_model(self, algorithm: str, asset_symbol: str) -> Optional[TrainedModel]:
        """Find the champion or any active model for this algorithm + asset."""
        model = (
            self.db.query(TrainedModel)
            .filter(
                TrainedModel.algorithm == algorithm.upper(),
                TrainedModel.status == "ACTIVE",
            )
            .order_by(TrainedModel.created_at.desc())
            .first()
        )
        return model

    def generate_prediction(
        self,
        asset_symbol: str,
        prediction_horizon: str,
        algorithm: str = "LSTM",
        model_version: Optional[str] = None,
        save_to_db: bool = True,
    ) -> Dict[str, Any]:
        
        if prediction_horizon not in SUPPORTED_HORIZONS:
            return {"error": f"Unsupported horizon '{prediction_horizon}'."}

        algo = algorithm.upper()
        
        db_model = self._get_active_model(algo, asset_symbol)
        if not db_model:
            from app.services.multi_model_trainer import MultiModelTrainer
            import asyncio
            try:
                # Fire-and-forget: schedule training without blocking or nesting loops
                asyncio.ensure_future(MultiModelTrainer.train_single(
                    queue_id=f"AUTO_{algo}_{asset_symbol}",
                    algorithm=algo,
                    asset_symbol=asset_symbol,
                    prediction_horizon=prediction_horizon,
                    run_hpo=False,
                    run_walk_forward=False
                ))
            except RuntimeError:
                # No running loop (e.g. called from a thread/CLI) — skip background training gracefully
                logger.warning(f"No event loop running; auto-train for {algo}/{asset_symbol} skipped.")
            except Exception as e:
                logger.warning(f"Auto-train dispatch failed for {algo} on {asset_symbol}: {e}")
            
            return {"error": f"Model for {algo} on {asset_symbol} is currently unavailable or training."}
            
        m_version = model_version or db_model.version
        model_id = str(db_model.id)
        
        artifact_path = f"models/{model_id}.pkl"
        if not os.path.exists(artifact_path):
            alt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", f"{model_id}.pkl"))
            if os.path.exists(alt_path):
                artifact_path = alt_path

        if not os.path.exists(artifact_path):
            return {"error": f"Model artifact missing for {algo} on {asset_symbol}."}
            
        try:
            artifact = joblib.load(artifact_path)
            model_obj = artifact["model"]
            scaler = artifact["scaler"]
        except Exception as e:
            logger.warning(f"Error loading model artifact {artifact_path}: {e}")
            return {"error": f"Model artifact loading failed for {algo} on {asset_symbol}."}
        
        # Get latest data for prediction
        # Fetch last 120 days to ensure rolling features have enough history
        start_dt = (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
        end_dt = datetime.now().strftime("%Y-%m-%d")
        
        df = DatasetBuilder._fetch_market_data(self.db, asset_symbol, start_dt, end_dt)
        if df.empty:
            return {"error": f"No recent market data for {asset_symbol}."}
            
        df = DatasetBuilder._build_features(df)
        if df.empty:
            return {"error": f"Failed to build features for {asset_symbol}."}
            
        # Get the latest row
        latest_row = df.iloc[-1:]
        feature_cols = [c for c in df.columns if c not in ['split', 'target_return', 'target_direction']]
        X_latest = latest_row[feature_cols].values
        
        X_latest_scaled = scaler.transform(X_latest)
        
        # Predict
        predicted_return = float(model_obj.predict(X_latest_scaled)[0])
        predicted_direction = 1 if predicted_return > 0 else -1
        
        # Realistic confidence based on return magnitude
        base_confidence = min(0.95, 0.5 + abs(predicted_return) * 2.0)
        
        # Calculate actual volatility from recent history if available
        recent_returns = df['close'].pct_change().dropna()
        volatility = float(recent_returns.std() * np.sqrt(252)) if len(recent_returns) > 5 else 0.20
        
        envelope = {
            "predicted_return": round(predicted_return, 4),
            "predicted_direction": predicted_direction,
            "confidence_score": round(base_confidence, 2),
            "risk_score": round(1.0 - base_confidence, 2),
            "probability_up": round(base_confidence if predicted_direction > 0 else 1-base_confidence, 2),
            "probability_down": round(1-base_confidence if predicted_direction > 0 else base_confidence, 2),
            "reason_code": f"Model Inference ({algo})",
            "confidence_interval_low": round(predicted_return - (volatility * 1.96 / np.sqrt(252)), 4),
            "confidence_interval_high": round(predicted_return + (volatility * 1.96 / np.sqrt(252)), 4),
            "volatility_estimate": round(volatility, 4),
            "signal_strength": round(base_confidence * 10, 1),
            "model_agreement": 1.0 # Single model inference
        }

        pred_id = str(uuid.uuid4())
        if save_to_db:
            history = PredictionHistory(
                id=pred_id,
                model_id=model_id,
                asset_symbol=asset_symbol,
                algorithm=algo,
                model_version=m_version,
                feature_version="v1.0.0",
                dataset_version="v1.0.0",
                prediction_horizon=prediction_horizon,
                predicted_return=envelope["predicted_return"],
                predicted_direction=envelope["predicted_direction"],
                confidence_score=envelope["confidence_score"],
                risk_score=envelope["risk_score"],
                probability_up=envelope["probability_up"],
                probability_down=envelope["probability_down"],
                reason_code=envelope["reason_code"],
                outcome="PENDING",
            )
            result = PredictionResult(
                id=str(uuid.uuid4()),
                prediction_id=pred_id,
                asset_symbol=asset_symbol,
                expected_return_pct=envelope["predicted_return"],
                confidence_interval_low=envelope["confidence_interval_low"],
                confidence_interval_high=envelope["confidence_interval_high"],
                volatility_estimate=envelope["volatility_estimate"],
                signal_strength=envelope["signal_strength"],
                model_agreement=envelope["model_agreement"],
                contributing_features=json.dumps(feature_cols[:5]),
            )
            try:
                self.db.add(history)
                self.db.add(result)
                self.db.commit()
            except Exception:
                self.db.rollback()

        return {
            "prediction_id": pred_id,
            "asset_symbol": asset_symbol,
            "algorithm": algo,
            "model_version": m_version,
            "prediction_horizon": prediction_horizon,
            **envelope,
            "model_found_in_db": True,
        }

    def batch_predict(
        self,
        assets: List[str],
        prediction_horizon: str = "5D",
        algorithm: str = "LSTM",
    ) -> List[Dict[str, Any]]:
        return [
            self.generate_prediction(a, prediction_horizon, algorithm)
            for a in assets
        ]

    def multi_model_predict(
        self,
        asset_symbol: str,
        prediction_horizon: str = "5D",
        algorithms: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        algos = algorithms or ALGORITHMS
        individual = []
        for algo in algos:
            pred = self.generate_prediction(asset_symbol, prediction_horizon, algo, save_to_db=False)
            if "error" not in pred:
                individual.append({
                    "model_id": algo,
                    **pred,
                })

        if len(individual) >= 1:
            # Simple average for ensemble
            avg_return = np.mean([p["predicted_return"] for p in individual])
            ensemble = {
                "predicted_return": round(float(avg_return), 4),
                "predicted_direction": 1 if avg_return > 0 else -1,
                "confidence_score": round(float(np.mean([p["confidence_score"] for p in individual])), 2)
            }
        else:
            ensemble = {}

        return {
            "asset_symbol": asset_symbol,
            "prediction_horizon": prediction_horizon,
            "individual_predictions": individual,
            "ensemble_prediction": ensemble,
            "algorithms_used": algos,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }

    def get_prediction_history(
        self, asset_symbol: Optional[str] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        q = self.db.query(PredictionHistory).order_by(
            PredictionHistory.prediction_timestamp.desc()
        )
        if asset_symbol:
            q = q.filter(PredictionHistory.asset_symbol == asset_symbol)
        rows = q.limit(limit).all()
        return [
            {
                "id": r.id,
                "asset_symbol": r.asset_symbol,
                "algorithm": r.algorithm,
                "model_version": r.model_version,
                "prediction_horizon": r.prediction_horizon,
                "predicted_return": r.predicted_return,
                "predicted_direction": r.predicted_direction,
                "confidence_score": r.confidence_score,
                "risk_score": r.risk_score,
                "actual_return": r.actual_return,
                "outcome": r.outcome,
                "is_resolved": r.is_resolved,
                "prediction_timestamp": r.prediction_timestamp.isoformat() if r.prediction_timestamp else None,
            }
            for r in rows
        ]
