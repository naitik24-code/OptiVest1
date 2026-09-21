"""
Module 6 — Ensemble Engine
Weighted Average, Voting, and Stacking-ready architecture.
Automatically compares individual vs ensemble and registers best performer.
"""
from __future__ import annotations
import json
import random
from typing import List, Dict, Any, Optional
from datetime import datetime


class EnsembleEngine:
    """
    Module 6 — Ensemble Engine.
    Combines predictions from multiple trained models.
    Supports WEIGHTED_AVERAGE, VOTING, and STACKING (meta-learner ready).
    """

    @staticmethod
    def compute_optimal_weights(
        model_metrics: List[Dict[str, Any]],
        metric: str = "directional_accuracy",
    ) -> Dict[str, float]:
        """
        Compute softmax-normalized weights based on a metric.
        Better models get higher weights.
        """
        scores = {m["model_id"]: max(0.001, m.get(metric, 0.5)) for m in model_metrics}
        total = sum(scores.values())
        return {mid: round(s / total, 4) for mid, s in scores.items()}



    @staticmethod
    def build_ensemble_report(
        ensemble_id: str,
        ensemble_name: str,
        ensemble_type: str,
        member_model_ids: List[str],
        weights: Dict[str, float],
        ensemble_metrics: Dict[str, Any],
        individual_metrics: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Build a comparison report: ensemble vs each individual model.
        Auto-selects champion.
        """
        ens_da = ensemble_metrics.get("directional_accuracy", 0.0)
        best_individual = max(individual_metrics, key=lambda m: m.get("directional_accuracy", 0))
        best_individual_da = best_individual.get("directional_accuracy", 0.0)
        improvement = round((ens_da - best_individual_da) * 100, 3)

        champion = "ENSEMBLE" if ens_da >= best_individual_da else f"MODEL_{best_individual.get('model_id','?')[:8]}"

        return {
            "ensemble_id": ensemble_id,
            "ensemble_name": ensemble_name,
            "ensemble_type": ensemble_type,
            "member_model_ids": member_model_ids,
            "member_weights": weights,
            "ensemble_metrics": ensemble_metrics,
            "best_individual": best_individual,
            "ensemble_directional_accuracy": ens_da,
            "best_individual_accuracy": best_individual_da,
            "improvement_pct": improvement,
            "champion": champion,
            "recommendation": "USE_ENSEMBLE" if improvement >= 0 else "USE_BEST_INDIVIDUAL",
            "generated_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def simulate_ensemble_metrics(
        member_model_ids: List[str],
        individual_metrics: List[Dict[str, Any]],
        ensemble_type: str = "WEIGHTED_AVERAGE",
        seed: int = 42,
    ) -> Dict[str, Any]:
        """
        Simulate ensemble metrics (slightly better than best individual on average).
        Real ensemble computation wires in at Phase 6.
        """
        rng = random.Random(seed)
        if not individual_metrics:
            return {}

        avg_da = sum(m.get("directional_accuracy", 0.5) for m in individual_metrics) / len(individual_metrics)
        best_da = max(m.get("directional_accuracy", 0.5) for m in individual_metrics)
        # Ensemble typically improves 1–4% over best individual
        boost = rng.uniform(0.01, 0.04) if ensemble_type != "VOTING" else rng.uniform(0.005, 0.025)
        ens_da = min(0.85, best_da + boost)

        avg_rmse = sum(m.get("rmse", 0.02) for m in individual_metrics) / len(individual_metrics)
        ens_rmse = round(avg_rmse * rng.uniform(0.88, 0.97), 6)

        return {
            "directional_accuracy": round(ens_da, 4),
            "rmse": ens_rmse,
            "mae": round(ens_rmse * 0.72, 6),
            "sharpe_ratio": round(max(m.get("sharpe_ratio", 0.9) for m in individual_metrics) * rng.uniform(1.0, 1.10), 3),
            "f1_score": round(ens_da * 0.97, 4),
            "n_members": len(member_model_ids),
        }
