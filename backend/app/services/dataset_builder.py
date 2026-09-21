"""
Module 2 — Dataset Builder
Generates time-series aware training datasets with sliding window,
train/validation/test splits, and multiple forecast horizons.
No random splits — strictly chronological.
"""
from __future__ import annotations
import math
import json
import hashlib
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import select, asc

from app.models.market_price import MarketPrice

PREDICTION_HORIZONS = {
    "1D": 1, "5D": 5, "10D": 10, "20D": 20, "30D": 30, "90D": 90
}

ALGORITHMS = [
    "LSTM", "GRU", "XGBOOST", "LIGHTGBM", "RANDOM_FOREST",
    "EXTRA_TREES", "LINEAR_REGRESSION"
]

class DatasetConfig:
    """Configuration for a single training dataset build."""
    def __init__(
        self,
        asset_symbol: str = "AAPL",
        sequence_length: int = 60,
        prediction_horizon: str = "5D",
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        feature_version: str = "v1.0.0",
        dataset_version: str = "v1.0.0",
        start_date: str = "2020-01-01",
        end_date: str = "2026-06-30",
    ):
        self.asset_symbol = asset_symbol
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        self.horizon_days = PREDICTION_HORIZONS.get(prediction_horizon, 5)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = round(1.0 - train_ratio - val_ratio, 3)
        self.feature_version = feature_version
        self.dataset_version = dataset_version
        self.start_date = start_date
        self.end_date = end_date

class DatasetSplit:
    """Represents a train/val/test time split."""
    def __init__(self, name: str, start: str, end: str, n_samples: int):
        self.name = name
        self.start = start
        self.end = end
        self.n_samples = n_samples

    def to_dict(self) -> Dict[str, Any]:
        return {
            "split": self.name,
            "start": self.start,
            "end": self.end,
            "n_samples": self.n_samples,
        }

class DatasetBuilder:
    """
    Module 2 — Dataset Builder.
    Builds time-series aware sliding-window datasets using REAL market data.
    """

    @staticmethod
    def _fetch_market_data(db: Session, symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
        stmt = (
            select(MarketPrice)
            .where(MarketPrice.symbol == symbol)
            .where(MarketPrice.timestamp >= datetime.strptime(start_date, "%Y-%m-%d"))
            .where(MarketPrice.timestamp <= datetime.strptime(end_date, "%Y-%m-%d"))
            .order_by(asc(MarketPrice.timestamp))
        )
        results = db.scalars(stmt).all()
        
        if not results:
            return pd.DataFrame()
            
        data = [{
            "timestamp": r.timestamp.replace(tzinfo=None),
            "open": float(r.open),
            "high": float(r.high),
            "low": float(r.low),
            "close": float(r.close),
            "volume": float(r.volume)
        } for r in results]
        
        df = pd.DataFrame(data)
        df.set_index("timestamp", inplace=True)
        return df

    @staticmethod
    def _build_features(df: pd.DataFrame) -> pd.DataFrame:
        """Construct standard features. Avoid data leakage!"""
        df = df.copy()
        df.sort_index(inplace=True)
        
        # 1. Returns
        df['return_1d'] = df['close'].pct_change(1)
        df['return_5d'] = df['close'].pct_change(5)
        df['return_20d'] = df['close'].pct_change(20)
        df['log_return'] = np.log(df['close'] / df['close'].shift(1))
        
        # 2. Moving Averages
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
        df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
        
        # 3. Volatility
        df['high_low_spread'] = (df['high'] - df['low']) / df['close']
        df['volatility_20d'] = df['return_1d'].rolling(window=20).std()
        
        # MACD
        df['macd'] = df['ema_12'] - df['ema_26']
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
        
        # Volume features
        df['volume_sma_20'] = df['volume'].rolling(window=20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma_20'].replace(0, np.nan)
        
        # Drop rows where features are NaN due to lookback
        df.dropna(inplace=True)
        return df

    @staticmethod
    def _build_target(df: pd.DataFrame, horizon_days: int) -> pd.DataFrame:
        """
        Target: Return horizon_days in the future.
        If today is T, target is (Close_{T+horizon} - Close_T) / Close_T
        """
        df = df.copy()
        # The target must look AHEAD. .shift(-horizon_days) shifts future values back to current row.
        df['target_return'] = df['close'].shift(-horizon_days) / df['close'] - 1.0
        
        # We classify positive return as 1, otherwise 0
        df['target_direction'] = (df['target_return'] > 0).astype(int)
        
        # Drop rows where target is NaN (the last `horizon_days` rows)
        df.dropna(subset=['target_return', 'target_direction'], inplace=True)
        return df

    @staticmethod
    def build_dataset(db: Session, config: DatasetConfig) -> Tuple[Dict[str, Any], pd.DataFrame]:
        """
        Fetches data, builds features and targets, handles missing values, 
        and computes the split indices.
        Returns: (metadata_dict, full_prepared_dataframe)
        """
        df = DatasetBuilder._fetch_market_data(db, config.asset_symbol, config.start_date, config.end_date)
        if df.empty:
            raise ValueError(f"No market data found for {config.asset_symbol} between {config.start_date} and {config.end_date}")
            
        # Build features
        df = DatasetBuilder._build_features(df)
        
        # Build target
        df = DatasetBuilder._build_target(df, config.horizon_days)
        
        n = len(df)
        min_required = config.sequence_length + config.horizon_days + 30
        if n < min_required:
            raise ValueError(
                f"Only {n} usable trading days available after feature generation; "
                f"need at least {min_required}."
            )
            
        train_end_idx = int(n * config.train_ratio)
        val_end_idx = int(n * (config.train_ratio + config.val_ratio))
        
        # We use iloc to find the dates
        train_df = df.iloc[:train_end_idx]
        val_df = df.iloc[train_end_idx:val_end_idx]
        test_df = df.iloc[val_end_idx:]
        
        def usable(k: int) -> int:
            return max(0, k - config.sequence_length + 1)
            
        splits = [
            DatasetSplit("TRAIN", str(train_df.index[0].date()), str(train_df.index[-1].date()), usable(len(train_df))),
            DatasetSplit("VALIDATION", str(val_df.index[0].date()), str(val_df.index[-1].date()), usable(len(val_df))),
            DatasetSplit("TEST", str(test_df.index[0].date()), str(test_df.index[-1].date()), usable(len(test_df))),
        ]
        
        checksum_src = (
            f"{config.asset_symbol}_{config.dataset_version}_{config.feature_version}_"
            f"{config.start_date}_{config.end_date}_{config.sequence_length}_{config.prediction_horizon}_{n}"
        )
        checksum = hashlib.sha256(checksum_src.encode()).hexdigest()
        
        plan = {
            "asset_symbol": config.asset_symbol,
            "dataset_version": config.dataset_version,
            "feature_version": config.feature_version,
            "sequence_length": config.sequence_length,
            "prediction_horizon": config.prediction_horizon,
            "horizon_days": config.horizon_days,
            "total_trading_days": n,
            "splits": [s.to_dict() for s in splits],
            "total_sequences": sum(s.n_samples for s in splits),
            "train_sequences": splits[0].n_samples,
            "val_sequences": splits[1].n_samples,
            "test_sequences": splits[2].n_samples,
            "checksum": checksum,
            "built_at": datetime.utcnow().isoformat(),
            "is_time_series_aware": True,
            "random_split_used": False,
        }
        
        # Add column to denote splits for downstream users
        df['split'] = 'TEST'
        df.iloc[:train_end_idx, df.columns.get_loc('split')] = 'TRAIN'
        df.iloc[train_end_idx:val_end_idx, df.columns.get_loc('split')] = 'VALIDATION'
        
        return plan, df

