"""
Feature Engineering Service — Phase 5: ML Engine Initiation
Defines the complete feature pipeline specification for all ML models.
No actual model training is performed here; this module defines the
WHAT (features, transformations, schema) that feeds into training.
"""
from typing import List, Dict, Any
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE SCHEMA DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FeatureSpec:
    name: str
    source: str          # RAW | TECHNICAL | FUNDAMENTAL | SENTIMENT | MACRO
    dtype: str           # float32 | int32 | bool
    lookback: int        # bars of history needed
    importance: float    # 0.0 – 1.0 (from SHAP baseline)
    description: str


@dataclass
class FeaturePipelineConfig:
    version: str
    model_target: str
    window_size: int           # sequence length fed to LSTM
    prediction_steps: int      # how many bars ahead we predict
    features: List[FeatureSpec] = field(default_factory=list)

    @property
    def feature_names(self) -> List[str]:
        return [f.name for f in self.features]

    @property
    def feature_count(self) -> int:
        return len(self.features)


# ─────────────────────────────────────────────────────────────────────────────
# CANONICAL FEATURE SET — v1.0.0
# Ordered by SHAP importance (descending, from baseline analysis)
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_PIPELINE_V1 = FeaturePipelineConfig(
    version="v1.0.0",
    model_target="PRICE_DIRECTION_5D",
    window_size=60,
    prediction_steps=5,
    features=[
        # ── Price-Derived Raw ─────────────────────────────────────────────
        FeatureSpec("close_pct_change_1d",  "RAW",       "float32", 2,   0.94, "1-day close return"),
        FeatureSpec("close_pct_change_5d",  "RAW",       "float32", 6,   0.88, "5-day close return"),
        FeatureSpec("close_pct_change_20d", "RAW",       "float32", 21,  0.82, "20-day close return"),
        FeatureSpec("log_return",           "RAW",       "float32", 2,   0.91, "Log price return"),
        FeatureSpec("high_low_spread",      "RAW",       "float32", 1,   0.73, "High-Low daily spread"),
        FeatureSpec("open_close_body",      "RAW",       "float32", 1,   0.70, "OHLC candle body size"),
        FeatureSpec("volume_log",           "RAW",       "float32", 1,   0.66, "Log-normalised volume"),

        # ── Momentum Indicators ───────────────────────────────────────────
        FeatureSpec("rsi_14",               "TECHNICAL", "float32", 15,  0.89, "RSI(14)"),
        FeatureSpec("rsi_28",               "TECHNICAL", "float32", 29,  0.75, "RSI(28)"),
        FeatureSpec("macd_line",            "TECHNICAL", "float32", 35,  0.83, "MACD signal line"),
        FeatureSpec("macd_hist",            "TECHNICAL", "float32", 35,  0.81, "MACD histogram"),
        FeatureSpec("stoch_k",              "TECHNICAL", "float32", 15,  0.69, "Stochastic %K"),
        FeatureSpec("stoch_d",              "TECHNICAL", "float32", 15,  0.67, "Stochastic %D"),
        FeatureSpec("williams_r",           "TECHNICAL", "float32", 14,  0.65, "Williams %R"),
        FeatureSpec("cci_20",               "TECHNICAL", "float32", 21,  0.62, "CCI(20)"),

        # ── Trend Indicators ──────────────────────────────────────────────
        FeatureSpec("sma_20",               "TECHNICAL", "float32", 21,  0.78, "SMA(20)"),
        FeatureSpec("sma_50",               "TECHNICAL", "float32", 51,  0.76, "SMA(50)"),
        FeatureSpec("ema_12",               "TECHNICAL", "float32", 13,  0.80, "EMA(12)"),
        FeatureSpec("ema_26",               "TECHNICAL", "float32", 27,  0.77, "EMA(26)"),
        FeatureSpec("price_above_sma50",    "TECHNICAL", "bool",    51,  0.71, "Close > SMA50 flag"),
        FeatureSpec("golden_cross",         "TECHNICAL", "bool",    52,  0.68, "SMA20 > SMA50 flag"),
        FeatureSpec("adx_14",               "TECHNICAL", "float32", 28,  0.64, "ADX(14) trend strength"),

        # ── Volatility Indicators ─────────────────────────────────────────
        FeatureSpec("bb_upper",             "TECHNICAL", "float32", 21,  0.72, "Bollinger Upper Band"),
        FeatureSpec("bb_lower",             "TECHNICAL", "float32", 21,  0.71, "Bollinger Lower Band"),
        FeatureSpec("bb_width",             "TECHNICAL", "float32", 21,  0.79, "Bollinger Band Width"),
        FeatureSpec("bb_position",          "TECHNICAL", "float32", 21,  0.76, "Close position within BBands"),
        FeatureSpec("atr_14",               "TECHNICAL", "float32", 15,  0.74, "Average True Range(14)"),
        FeatureSpec("hist_volatility_20",   "TECHNICAL", "float32", 21,  0.70, "20-day historical volatility"),

        # ── Volume-Based ──────────────────────────────────────────────────
        FeatureSpec("obv_norm",             "TECHNICAL", "float32", 2,   0.67, "Normalised On-Balance Volume"),
        FeatureSpec("vwap_dev",             "TECHNICAL", "float32", 2,   0.65, "VWAP deviation"),
        FeatureSpec("volume_sma_ratio",     "TECHNICAL", "float32", 21,  0.63, "Volume / 20-day avg volume"),

        # ── Market Context ────────────────────────────────────────────────
        FeatureSpec("spy_corr_20d",         "MACRO",     "float32", 21,  0.58, "20-day rolling SPY correlation"),
        FeatureSpec("vix_level",            "MACRO",     "float32", 1,   0.61, "CBOE VIX close"),
        FeatureSpec("sector_rel_strength",  "MACRO",     "float32", 21,  0.55, "Sector relative strength"),

        # ── Calendar Features ─────────────────────────────────────────────
        FeatureSpec("day_of_week",          "RAW",       "float32", 1,   0.42, "Day of week (0-4)"),
        FeatureSpec("month",                "RAW",       "float32", 1,   0.39, "Month (1-12)"),
        FeatureSpec("is_earnings_week",     "FUNDAMENTAL","bool",   1,   0.48, "Flag: earnings week"),
    ]
)


class FeatureEngineeringService:
    """
    Central registry of feature pipelines.
    Returns definitions, schemas and importance metadata for the
    ML registry and training orchestration system.
    """

    PIPELINES: Dict[str, FeaturePipelineConfig] = {
        "v1.0.0": FEATURE_PIPELINE_V1,
    }

    @classmethod
    def get_pipeline(cls, version: str = "v1.0.0") -> FeaturePipelineConfig:
        return cls.PIPELINES.get(version, FEATURE_PIPELINE_V1)

    @classmethod
    def list_pipelines(cls) -> List[str]:
        return list(cls.PIPELINES.keys())

    @classmethod
    def get_feature_schema(cls, version: str = "v1.0.0") -> Dict[str, Any]:
        p = cls.get_pipeline(version)
        return {
            "version": p.version,
            "model_target": p.model_target,
            "window_size": p.window_size,
            "prediction_steps": p.prediction_steps,
            "feature_count": p.feature_count,
            "max_lookback_bars": max(f.lookback for f in p.features),
            "features": [
                {
                    "name": f.name,
                    "source": f.source,
                    "dtype": f.dtype,
                    "lookback": f.lookback,
                    "importance": f.importance,
                    "description": f.description,
                }
                for f in sorted(p.features, key=lambda x: -x.importance)
            ],
        }

    @classmethod
    def get_importance_ranking(cls, version: str = "v1.0.0") -> List[Dict[str, Any]]:
        p = cls.get_pipeline(version)
        ranked = sorted(p.features, key=lambda x: -x.importance)
        return [
            {
                "rank": i + 1,
                "feature_name": f.name,
                "importance_score": f.importance,
                "source": f.source,
                "normalized_importance": round(f.importance / ranked[0].importance, 4),
            }
            for i, f in enumerate(ranked)
        ]

    @classmethod
    def get_source_breakdown(cls, version: str = "v1.0.0") -> Dict[str, Any]:
        p = cls.get_pipeline(version)
        breakdown: Dict[str, int] = {}
        for f in p.features:
            breakdown[f.source] = breakdown.get(f.source, 0) + 1
        return {
            "total_features": p.feature_count,
            "by_source": breakdown,
            "avg_importance": round(
                sum(f.importance for f in p.features) / len(p.features), 4
            ),
        }
