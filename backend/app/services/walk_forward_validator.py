"""
Module 3 — Walk-Forward Validation Engine
Rolling, Expanding, and Walk-Forward validation.
Strictly time-series aware — no random splits ever.
"""
from __future__ import annotations
import math
from typing import List, Dict, Any
from datetime import datetime


class ValidationFold:
    def __init__(self, fold: int, val_type: str,
                 train_start: str, train_end: str,
                 test_start: str, test_end: str,
                 train_n: int, test_n: int):
        self.fold = fold
        self.val_type = val_type
        self.train_start = train_start
        self.train_end = train_end
        self.test_start = test_start
        self.test_end = test_end
        self.train_n = train_n
        self.test_n = test_n

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fold": self.fold,
            "validation_type": self.val_type,
            "train_start": self.train_start,
            "train_end": self.train_end,
            "test_start": self.test_start,
            "test_end": self.test_end,
            "train_samples": self.train_n,
            "test_samples": self.test_n,
        }


class WalkForwardValidator:
    """
    Module 3 — Walk-Forward Validation Engine.
    Supports ROLLING, EXPANDING, and WALK_FORWARD modes.
    """

    @staticmethod
    def generate_folds(
        all_dates: List[str],
        n_splits: int = 5,
        mode: str = "WALK_FORWARD",
        min_train_pct: float = 0.50,
        test_pct: float = 0.15,
    ) -> List[Dict[str, Any]]:
        """
        Generate time-series cross-validation folds.
        mode: WALK_FORWARD | ROLLING | EXPANDING
        """
        n = len(all_dates)
        min_train = int(n * min_train_pct)
        test_size = max(int(n * test_pct), 10)

        folds = []
        step = max(1, (n - min_train) // n_splits)

        for i in range(n_splits):
            if mode == "EXPANDING":
                # Train grows, test window fixed
                train_end_idx = min_train + i * step
                test_start_idx = train_end_idx
                test_end_idx = min(test_start_idx + test_size, n - 1)
                train_start_idx = 0
            elif mode == "ROLLING":
                # Fixed train window slides forward
                test_start_idx = min_train + i * step
                test_end_idx = min(test_start_idx + test_size, n - 1)
                train_start_idx = max(0, test_start_idx - min_train)
                train_end_idx = test_start_idx
            else:  # WALK_FORWARD (standard)
                train_end_idx = min_train + i * step
                test_start_idx = train_end_idx
                test_end_idx = min(test_start_idx + test_size, n - 1)
                train_start_idx = 0

            if test_start_idx >= n or test_end_idx >= n:
                break

            fold = ValidationFold(
                fold=i + 1,
                val_type=mode,
                train_start=all_dates[train_start_idx],
                train_end=all_dates[train_end_idx - 1],
                test_start=all_dates[test_start_idx],
                test_end=all_dates[test_end_idx],
                train_n=train_end_idx - train_start_idx,
                test_n=test_end_idx - test_start_idx + 1,
            )
            folds.append(fold.to_dict())

        return folds

    @staticmethod
    def simulate_fold_metrics(fold: Dict[str, Any], algorithm: str) -> Dict[str, Any]:
        """
        Simulate realistic per-fold evaluation metrics.
        Real metrics will be computed from actual model predictions in Phase 6.
        """
        import random, math
        rng = random.Random(hash(f"{fold['fold']}_{algorithm}"))

        # Algorithm-realistic metric ranges
        algo_profile = {
            "LSTM":              (0.62, 0.015, 0.95),
            "GRU":               (0.61, 0.016, 0.93),
            "XGBOOST":           (0.58, 0.018, 0.88),
            "LIGHTGBM":          (0.57, 0.019, 0.87),
            "RANDOM_FOREST":     (0.56, 0.020, 0.85),
            "EXTRA_TREES":       (0.55, 0.021, 0.84),
            "LINEAR_REGRESSION": (0.52, 0.025, 0.75),
        }.get(algorithm, (0.55, 0.020, 0.85))

        base_da, base_rmse_mult, base_sharpe_mult = algo_profile
        noise = rng.uniform(-0.04, 0.04)

        da = min(0.80, max(0.45, base_da + noise))
        rmse = round(base_rmse_mult * rng.uniform(0.8, 1.2), 5)
        mae = round(rmse * rng.uniform(0.6, 0.8), 5)
        mape = round(rng.uniform(1.5, 4.0), 3)
        r2 = round(1 - (rmse ** 2) / (rmse ** 2 + 0.001), 4)
        sharpe = round(base_sharpe_mult * rng.uniform(0.7, 1.3), 3)
        hit_ratio = round(da * rng.uniform(0.95, 1.05), 4)

        return {
            **fold,
            "algorithm": algorithm,
            "rmse": rmse,
            "mae": mae,
            "mape": mape,
            "r_squared": r2,
            "directional_accuracy": round(da, 4),
            "sharpe_ratio": sharpe,
            "hit_ratio": hit_ratio,
            "evaluated_at": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def aggregate_fold_report(fold_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate per-fold metrics into a summary report."""
        if not fold_results:
            return {}

        def avg(key: str) -> float:
            vals = [f[key] for f in fold_results if key in f]
            return round(sum(vals) / len(vals), 5) if vals else 0.0

        def std(key: str) -> float:
            vals = [f[key] for f in fold_results if key in f]
            if len(vals) < 2:
                return 0.0
            mean = sum(vals) / len(vals)
            return round(math.sqrt(sum((v - mean) ** 2 for v in vals) / len(vals)), 5)

        metrics = ["rmse", "mae", "mape", "r_squared", "directional_accuracy", "sharpe_ratio", "hit_ratio"]
        return {
            "n_folds": len(fold_results),
            "validation_type": fold_results[0].get("validation_type", "WALK_FORWARD"),
            "algorithm": fold_results[0].get("algorithm", "UNKNOWN"),
            "mean": {m: avg(m) for m in metrics},
            "std": {m: std(m) for m in metrics},
            "best_fold": max(fold_results, key=lambda f: f.get("directional_accuracy", 0)),
            "worst_fold": min(fold_results, key=lambda f: f.get("directional_accuracy", 1)),
            "folds": fold_results,
        }
