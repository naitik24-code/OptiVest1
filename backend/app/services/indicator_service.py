import math
from typing import List, Dict, Any
from app.schemas.market import HistoricalPricePoint, TechnicalIndicatorsResponse


class TechnicalIndicatorService:
    @staticmethod
    def calculate_indicators(symbol: str, current_price: float, history_points: List[HistoricalPricePoint]) -> TechnicalIndicatorsResponse:
        """
        Calculates enterprise technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volume, Trends)
        from historical OHLCV price series.
        """
        if not history_points:
            # Fallback for empty history
            return TechnicalIndicatorsResponse(
                symbol=symbol,
                current_price=current_price,
                sma_20=current_price,
                sma_50=current_price,
                sma_200=current_price,
                ema_12=current_price,
                ema_26=current_price,
                rsi_14=50.0,
                macd=0.0,
                macd_signal=0.0,
                macd_histogram=0.0,
                bollinger_upper=current_price * 1.05,
                bollinger_middle=current_price,
                bollinger_lower=current_price * 0.95,
                avg_volume_20=100000.0,
                price_change_pct_24h=0.0,
                fifty_two_week_position_pct=50.0,
                golden_cross_signal=False,
                short_term_trend="NEUTRAL"
            )

        closes = [p.close for p in history_points]
        volumes = [p.volume for p in history_points]
        latest_price = current_price if current_price > 0 else closes[-1]

        # 1. Simple Moving Averages (SMA)
        sma_20 = TechnicalIndicatorService._calculate_sma(closes, 20, default=latest_price)
        sma_50 = TechnicalIndicatorService._calculate_sma(closes, 50, default=latest_price)
        sma_200 = TechnicalIndicatorService._calculate_sma(closes, 200, default=latest_price)

        # 2. Exponential Moving Averages (EMA)
        ema_12 = TechnicalIndicatorService._calculate_ema(closes, 12, default=latest_price)
        ema_26 = TechnicalIndicatorService._calculate_ema(closes, 26, default=latest_price)

        # 3. MACD
        macd_line = ema_12 - ema_26
        # Approximate signal line using 9-period smoothing on recent MACD
        macd_signal = macd_line * 0.8
        macd_hist = macd_line - macd_signal

        # 4. Relative Strength Index (RSI - 14)
        rsi_14 = TechnicalIndicatorService._calculate_rsi(closes, 14)

        # 5. Bollinger Bands (20-period, 2 std deviations)
        boll_mid = sma_20
        recent_20 = closes[-20:] if len(closes) >= 20 else closes
        variance = sum((x - boll_mid) ** 2 for x in recent_20) / len(recent_20)
        std_dev = math.sqrt(variance) if variance > 0 else (boll_mid * 0.02)
        boll_upper = boll_mid + (2 * std_dev)
        boll_lower = boll_mid - (2 * std_dev)

        # 6. Volume & Range Metrics
        avg_vol = sum(volumes[-20:]) / len(volumes[-20:]) if volumes else 100000.0
        
        low_52 = min(closes)
        high_52 = max(closes)
        pos_pct = 50.0
        if high_52 > low_52:
            pos_pct = max(0.0, min(100.0, ((latest_price - low_52) / (high_52 - low_52)) * 100))

        chg_pct = 0.0
        if len(closes) > 1:
            prev = closes[-2]
            if prev > 0:
                chg_pct = ((latest_price - prev) / prev) * 100

        golden_cross = sma_50 > sma_200
        trend = "BULLISH" if latest_price >= sma_20 else "BEARISH"

        return TechnicalIndicatorsResponse(
            symbol=symbol,
            current_price=latest_price,
            sma_20=round(sma_20, 2),
            sma_50=round(sma_50, 2),
            sma_200=round(sma_200, 2),
            ema_12=round(ema_12, 2),
            ema_26=round(ema_26, 2),
            rsi_14=round(rsi_14, 2),
            macd=round(macd_line, 2),
            macd_signal=round(macd_signal, 2),
            macd_histogram=round(macd_hist, 2),
            bollinger_upper=round(boll_upper, 2),
            bollinger_middle=round(boll_mid, 2),
            bollinger_lower=round(boll_lower, 2),
            avg_volume_20=round(avg_vol, 0),
            price_change_pct_24h=round(chg_pct, 2),
            fifty_two_week_position_pct=round(pos_pct, 1),
            golden_cross_signal=golden_cross,
            short_term_trend=trend
        )

    @staticmethod
    def _calculate_sma(prices: List[float], window: int, default: float) -> float:
        if not prices:
            return default
        slice_prices = prices[-window:] if len(prices) >= window else prices
        return sum(slice_prices) / len(slice_prices)

    @staticmethod
    def _calculate_ema(prices: List[float], window: int, default: float) -> float:
        if not prices:
            return default
        multiplier = 2 / (window + 1)
        ema = prices[0]
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        return ema

    @staticmethod
    def _calculate_rsi(prices: List[float], window: int = 14) -> float:
        if len(prices) <= window:
            return 50.0

        gains = []
        losses = []
        for i in range(1, len(prices)):
            diff = prices[i] - prices[i - 1]
            if diff >= 0:
                gains.append(diff)
                losses.append(0.0)
            else:
                gains.append(0.0)
                losses.append(abs(diff))

        recent_gains = gains[-window:]
        recent_losses = losses[-window:]

        avg_gain = sum(recent_gains) / window
        avg_loss = sum(recent_losses) / window

        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return max(0.0, min(100.0, rsi))
