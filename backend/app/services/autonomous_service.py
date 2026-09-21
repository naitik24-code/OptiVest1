import logging
import math
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
import asyncio
import numpy as np

from app.db.session import SessionLocal
from app.models.autonomous import (
    ScheduledJob, JobStatus, Notification, NotificationType, NotificationChannel,
    PredictionQueue, SystemHealth, WorkerStatus, EventStream
)
from app.models.market_price import MarketPrice
from app.models.portfolio import Portfolio
from app.models.paper_trading import PaperWallet, PaperDecision, RecommendationTracking
from app.core.websocket import websocket_manager
from app.core.event_bus import event_bus
from app.services.apde_engine import APDEEngine

logger = logging.getLogger(__name__)

class AutonomousOrchestrator:
    """
    Centralized job orchestrator and autonomous decision loop manager.
    Module 1: Autonomous Job Orchestrator
    """
    def __init__(self):
        # Module 2: Event Bus Registration
        event_bus.subscribe("MarketDataUpdated", self.handle_market_update)
        event_bus.subscribe("PredictionGenerated", self.handle_prediction_generated)
        event_bus.subscribe("PortfolioChanged", self.handle_portfolio_changed)
        event_bus.subscribe("ModelDriftDetected", self.handle_drift_detected)

    # ==========================================
    # MODULE 5: MARKET REGIME WATCHER
    # ==========================================
    async def run_market_regime_watcher(self):
        logger.info("Running Market Regime Watcher...")
        db = SessionLocal()
        try:
            # Detect regime using real market data
            prices = db.query(MarketPrice).filter(MarketPrice.symbol == "SPY").order_by(MarketPrice.timestamp.desc()).limit(50).all()
            if len(prices) > 20:
                closes = [p.close for p in prices]
                sma20 = np.mean(closes[:20])
                sma50 = np.mean(closes)
                volatility = np.std(closes[:20]) / sma20
                
                regime = "Bull"
                if sma20 < sma50:
                    regime = "Bear"
                if volatility > 0.02:
                    regime = "High Volatility"
                elif volatility < 0.005:
                    regime = "Low Volatility"
                    
                await event_bus.publish("MarketDataUpdated", {"regime": regime, "volatility": float(volatility)})
        except Exception as e:
            logger.error(f"Market Regime Watcher Failed: {e}")
        finally:
            db.close()

    # ==========================================
    # MODULE 3: AUTOMATED PREDICTION REFRESH
    # ==========================================
    async def run_prediction_refresh(self):
        logger.info("Running Automated Prediction Refresh...")
        db = SessionLocal()
        try:
            active_assets = ["AAPL", "MSFT", "NVDA", "TSLA"]
            for symbol in active_assets:
                prices = db.query(MarketPrice).filter(MarketPrice.symbol == symbol).order_by(MarketPrice.timestamp.desc()).limit(10).all()
                if len(prices) == 10:
                    momentum = (prices[0].close - prices[-1].close) / prices[-1].close
                    
                    await event_bus.publish("PredictionGenerated", {
                        "symbol": symbol,
                        "expected_return": float(momentum),
                        "horizon": "1D",
                        "confidence": 0.85 if abs(momentum) > 0.02 else 0.5
                    })
        except Exception as e:
            logger.error(f"Prediction Refresh Failed: {e}")
        finally:
            db.close()

    # ==========================================
    # MODULE 6 & 7: MODEL HEALTH & DRIFT DETECTION
    # ==========================================
    async def run_model_health_watcher(self):
        logger.info("Running Model Health Watcher...")
        db = SessionLocal()
        try:
            trackings = db.query(RecommendationTracking).order_by(RecommendationTracking.created_at.desc()).limit(100).all()
            if trackings:
                acc = sum(1 for t in trackings if t.actual_return_generated and t.actual_return_generated > 0) / len(trackings)
                rmse = np.sqrt(np.mean([(t.actual_return_generated or 0 - 0.05)**2 for t in trackings]))
                
                if acc < 0.45:
                    await event_bus.publish("ModelDriftDetected", {
                        "type": "accuracy_drift",
                        "current_accuracy": acc,
                        "threshold": 0.45
                    })
                
                await event_bus.publish("ModelHealthUpdate", {
                    "accuracy": float(acc),
                    "rmse": float(rmse),
                    "drift_detected": acc < 0.45
                })
        finally:
            db.close()

    # ==========================================
    # MODULE 4: AUTOMATED APDE ANALYSIS
    # ==========================================
    async def handle_market_update(self, payload: dict):
        logger.info(f"Market update received. Triggering APDE evaluation. Regime: {payload.get('regime')}")
        await self._trigger_apde_for_all()

    async def handle_prediction_generated(self, payload: dict):
        logger.info(f"New prediction for {payload.get('symbol')}. Triggering APDE.")
        await self._trigger_apde_for_all()

    async def handle_portfolio_changed(self, payload: dict):
        logger.info("Portfolio changed. APDE queue updated.")
        await self._trigger_apde_for_all()
        
    async def handle_drift_detected(self, payload: dict):
        logger.warning(f"Drift detected: {payload}. Triggering autonomous retraining pipeline...")
        await self.generate_alert("SYSTEM", "CRITICAL", "Model Drift Detected", f"Accuracy dropped to {payload.get('current_accuracy')}")
        from app.services.multi_model_trainer import MultiModelTrainer
        db = SessionLocal()
        try:
            res = await MultiModelTrainer.train_single("AUTONOMOUS_RETRAIN_JOB", "LSTM", asset_symbol="SPY")
            logger.info(f"Autonomous Retraining Completed: {res}")
        except Exception as e:
            logger.error(f"Autonomous Retraining Failed: {e}")
        finally:
            db.close()

    async def _trigger_apde_for_all(self):
        db = SessionLocal()
        try:
            wallets = db.query(PaperWallet).all()
            for wallet in wallets:
                engine = APDEEngine(db)
                recommendations = engine.generate_recommendations(wallet.id)
                if recommendations:
                    for rec in recommendations:
                        await event_bus.publish("DecisionGenerated", {
                            "wallet_id": wallet.id,
                            "decision_id": rec["id"],
                            "action": rec["recommendation_type"],
                            "asset": rec["target_asset"]
                        })
                        await self.generate_alert("APDE", "INFO", "New AI Reallocation Decision", f"APDE recommends {rec['recommendation_type']} {rec['target_asset']}")
        finally:
            db.close()

    # ==========================================
    # MODULE 8: ALERT CENTER
    # ==========================================
    async def generate_alert(self, source: str, severity: str, title: str, message: str):
        payload = {
            "source": source,
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await event_bus.publish("SystemAlert", payload)
        
    # ==========================================
    # MODULE 10: COMMAND CENTER STATUS
    # ==========================================
    def get_system_status(self, db: Session):
        health = db.query(SystemHealth).all()
        recent_events = db.query(EventStream).order_by(EventStream.timestamp.desc()).limit(20).all()
        jobs = db.query(ScheduledJob).all()
        
        return {
            "health": [{"component": h.component, "status": h.status} for h in health],
            "scheduler_status": "ACTIVE",
            "active_jobs": len([j for j in jobs if j.is_active]),
            "event_stream": [{"id": e.id, "type": e.event_type, "payload": e.payload, "time": e.timestamp.isoformat()} for e in recent_events]
        }

autonomous_orchestrator = AutonomousOrchestrator()
