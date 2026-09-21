"""
Module 4 — Hyperparameter Optimizer
Grid Search, Random Search, and Optuna-ready architecture.
Stores every trial result for reproducibility.
"""
from __future__ import annotations
import random
import itertools
import json
from typing import List, Dict, Any, Optional
from datetime import datetime


# ── Default search spaces per algorithm ────────────────────────────────────
SEARCH_SPACES: Dict[str, Dict[str, List[Any]]] = {
    "LSTM": {
        "units":          [32, 64, 128, 256],
        "layers":         [1, 2, 3],
        "dropout":        [0.1, 0.2, 0.3, 0.4],
        "learning_rate":  [0.001, 0.0005, 0.0001],
        "batch_size":     [16, 32, 64],
        "epochs":         [50, 100, 150],
        "lookback":       [30, 60, 90],
    },
    "GRU": {
        "units":          [32, 64, 128, 256],
        "layers":         [1, 2, 3],
        "dropout":        [0.1, 0.2, 0.3],
        "learning_rate":  [0.001, 0.0005, 0.0001],
        "batch_size":     [16, 32, 64],
        "epochs":         [50, 100, 150],
    },
    "XGBOOST": {
        "n_estimators":   [100, 200, 500],
        "max_depth":      [3, 5, 7, 9],
        "learning_rate":  [0.01, 0.05, 0.1, 0.3],
        "subsample":      [0.6, 0.8, 1.0],
        "colsample":      [0.6, 0.8, 1.0],
        "min_child_weight": [1, 3, 5],
    },
    "LIGHTGBM": {
        "n_estimators":   [100, 200, 500],
        "max_depth":      [3, 5, 7, -1],
        "learning_rate":  [0.01, 0.05, 0.1],
        "num_leaves":     [31, 63, 127],
        "subsample":      [0.6, 0.8, 1.0],
        "min_data_in_leaf": [20, 50, 100],
    },
    "RANDOM_FOREST": {
        "n_estimators":   [100, 200, 500],
        "max_depth":      [5, 10, 20, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf":  [1, 2, 4],
        "max_features":   ["sqrt", "log2", 0.5],
    },
    "EXTRA_TREES": {
        "n_estimators":   [100, 200, 500],
        "max_depth":      [5, 10, 20, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf":  [1, 2, 4],
    },
    "LINEAR_REGRESSION": {
        "fit_intercept": [True, False],
        "normalize":     [True, False],
    },
}


class HPOTrial:
    """A single hyperparameter optimization trial."""
    def __init__(self, trial_number: int, hyperparameters: Dict[str, Any]):
        self.trial_number = trial_number
        self.hyperparameters = hyperparameters
        self.objective_value: float = 0.0
        self.directional_accuracy: float = 0.0
        self.rmse: float = 0.0
        self.training_time_s: float = 0.0
        self.status: str = "PENDING"
        self.is_best: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trial_number": self.trial_number,
            "hyperparameters": self.hyperparameters,
            "objective_value": self.objective_value,
            "directional_accuracy": self.directional_accuracy,
            "rmse": self.rmse,
            "training_time_s": self.training_time_s,
            "status": self.status,
            "is_best": self.is_best,
        }


class HyperparameterOptimizer:
    """
    Module 4 — Hyperparameter Optimizer.
    Generates trial configurations via GRID, RANDOM, or OPTUNA strategies.
    Simulates objective evaluation; real computation wires in at Phase 6.
    """

    def __init__(self, algorithm: str, strategy: str = "RANDOM", n_trials: int = 10, seed: int = 42):
        self.algorithm = algorithm.upper()
        self.strategy = strategy.upper()
        self.n_trials = n_trials
        self.rng = random.Random(seed)
        self.search_space = SEARCH_SPACES.get(self.algorithm, {})

    def _grid_configs(self) -> List[Dict[str, Any]]:
        keys = list(self.search_space.keys())
        values = [self.search_space[k] for k in keys]
        combos = list(itertools.product(*values))
        return [{keys[i]: c[i] for i in range(len(keys))} for c in combos]

    def _random_config(self) -> Dict[str, Any]:
        return {k: self.rng.choice(v) for k, v in self.search_space.items()}

    def generate_trials(self, experiment_name: str) -> Dict[str, Any]:
        """Generate and simulate all trials for the given strategy."""
        if self.strategy == "GRID":
            configs = self._grid_configs()[:self.n_trials]
        else:
            configs = [self._random_config() for _ in range(self.n_trials)]

        trials: List[HPOTrial] = []
        for i, cfg in enumerate(configs):
            t = HPOTrial(i + 1, cfg)
            t.status = "COMPLETED"
            # Simulate objective based on config (realistic noise)
            t.objective_value = self._simulate_objective(cfg)
            t.directional_accuracy = min(0.80, max(0.45, 0.55 + t.objective_value * 0.1 + self.rng.uniform(-0.03, 0.03)))
            t.rmse = round(0.020 - t.objective_value * 0.002 + self.rng.uniform(-0.002, 0.002), 5)
            t.training_time_s = round(self.rng.uniform(5.0, 120.0), 2)
            trials.append(t)

        # Mark best trial
        best = max(trials, key=lambda t: t.directional_accuracy)
        best.is_best = True

        return {
            "experiment_name": experiment_name,
            "algorithm": self.algorithm,
            "strategy": self.strategy,
            "n_trials": len(trials),
            "best_trial": best.to_dict(),
            "best_hyperparameters": best.hyperparameters,
            "best_directional_accuracy": best.directional_accuracy,
            "best_objective": best.objective_value,
            "trials": [t.to_dict() for t in trials],
            "completed_at": datetime.utcnow().isoformat(),
        }

    def _simulate_objective(self, cfg: Dict[str, Any]) -> float:
        """Deterministic but config-dependent simulated objective (val accuracy proxy)."""
        score = 0.5
        if "units" in cfg:
            score += {32: 0.01, 64: 0.02, 128: 0.03, 256: 0.025}.get(cfg["units"], 0.01)
        if "n_estimators" in cfg:
            score += min(0.04, cfg["n_estimators"] / 10000)
        if "learning_rate" in cfg:
            lr = cfg["learning_rate"]
            score += 0.03 if 0.0005 <= lr <= 0.01 else 0.01
        if "dropout" in cfg:
            score -= cfg.get("dropout", 0.2) * 0.05
        return round(min(0.95, max(0.0, score + self.rng.uniform(-0.02, 0.02))), 4)

    @staticmethod
    def get_default_hyperparameters(algorithm: str) -> Dict[str, Any]:
        """Return sensible defaults for an algorithm (no search needed)."""
        defaults = {
            "LSTM":              {"units": 128, "layers": 2, "dropout": 0.2, "learning_rate": 0.001, "batch_size": 32, "epochs": 100, "lookback": 60},
            "GRU":               {"units": 64,  "layers": 2, "dropout": 0.2, "learning_rate": 0.001, "batch_size": 32, "epochs": 100},
            "XGBOOST":           {"n_estimators": 200, "max_depth": 5, "learning_rate": 0.05, "subsample": 0.8, "colsample": 0.8, "min_child_weight": 1},
            "LIGHTGBM":          {"n_estimators": 200, "max_depth": 5, "learning_rate": 0.05, "num_leaves": 63, "subsample": 0.8, "min_data_in_leaf": 20},
            "RANDOM_FOREST":     {"n_estimators": 200, "max_depth": 10, "min_samples_split": 5, "min_samples_leaf": 2, "max_features": "sqrt"},
            "EXTRA_TREES":       {"n_estimators": 200, "max_depth": 10, "min_samples_split": 5, "min_samples_leaf": 2},
            "LINEAR_REGRESSION": {"fit_intercept": True},
        }
        return defaults.get(algorithm.upper(), {})
