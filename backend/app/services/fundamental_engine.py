import math
import uuid
import logging
from typing import Dict, Any, List, Optional, Union
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.asset import Asset
from app.models.asset_fundamental import AssetFundamental, PeriodType
from app.services.providers.yahoo_provider import YahooFinanceProvider

logger = logging.getLogger("optivest.fundamental_engine")


class FundamentalEngine:
    """
    Phase 19: Canonical Fundamental Intelligence Engine.
    Evaluates real financial quality, multi-period growth, profitability,
    balance sheet health, and earnings quality using audited financial statements.
    Strictly zero fabricated data.
    """

    def __init__(self, db: Session):
        self.db = db
        self.provider = YahooFinanceProvider()

    def _parse_asset_id(self, asset_id: Union[uuid.UUID, str]) -> uuid.UUID:
        """Ensure asset_id is a valid UUID instance for SQLite/PostgreSQL compatibility."""
        if isinstance(asset_id, uuid.UUID):
            return asset_id
        try:
            return uuid.UUID(str(asset_id))
        except ValueError:
            return uuid.uuid5(uuid.NAMESPACE_DNS, str(asset_id))

    def get_asset_fundamentals(
        self, asset_id: Union[uuid.UUID, str], symbol: str, exchange: Optional[str] = None
    ) -> List[AssetFundamental]:
        """
        Fetch time-series fundamental observations from DB, or fetch & persist from provider if missing/stale.
        Returns observations sorted newest to oldest.
        """
        parsed_id = self._parse_asset_id(asset_id)
        funds = self.db.query(AssetFundamental).filter(
            AssetFundamental.asset_id == parsed_id
        ).order_by(AssetFundamental.reporting_date.desc()).all()

        now = datetime.now(timezone.utc)
        if funds and funds[0].updated_at:
            upd = funds[0].updated_at
            if upd.tzinfo is not None:
                upd = upd.replace(tzinfo=None)
            now_naive = now.replace(tzinfo=None)
            is_stale = (now_naive - upd).days > 30
        else:
            is_stale = True

        if is_stale:
            try:
                raw_periods = self.provider.get_fundamentals(symbol, exchange)
                if raw_periods:
                    for period_data in raw_periods:
                        rep_date = period_data["reporting_date"]
                        existing = self.db.query(AssetFundamental).filter(
                            AssetFundamental.asset_id == parsed_id,
                            AssetFundamental.reporting_date == rep_date,
                            AssetFundamental.period_type == period_data["period_type"]
                        ).first()

                        if existing:
                            for key in [
                                "revenue", "gross_profit", "operating_income", "net_income", "eps",
                                "total_assets", "total_liabilities", "total_debt", "total_equity",
                                "cash_and_equivalents", "operating_cash_flow", "capital_expenditure",
                                "free_cash_flow", "shares_outstanding"
                            ]:
                                setattr(existing, key, period_data.get(key))
                            existing.updated_at = now
                        else:
                            new_fund = AssetFundamental(
                                asset_id=parsed_id,
                                symbol=symbol,
                                reporting_date=rep_date,
                                period_type=period_data["period_type"],
                                revenue=period_data.get("revenue"),
                                gross_profit=period_data.get("gross_profit"),
                                operating_income=period_data.get("operating_income"),
                                net_income=period_data.get("net_income"),
                                eps=period_data.get("eps"),
                                total_assets=period_data.get("total_assets"),
                                total_liabilities=period_data.get("total_liabilities"),
                                total_debt=period_data.get("total_debt"),
                                total_equity=period_data.get("total_equity"),
                                cash_and_equivalents=period_data.get("cash_and_equivalents"),
                                operating_cash_flow=period_data.get("operating_cash_flow"),
                                capital_expenditure=period_data.get("capital_expenditure"),
                                free_cash_flow=period_data.get("free_cash_flow"),
                                shares_outstanding=period_data.get("shares_outstanding")
                            )
                            self.db.add(new_fund)
                    self.db.commit()
                    # Re-query persisted records
                    funds = self.db.query(AssetFundamental).filter(
                        AssetFundamental.asset_id == parsed_id
                    ).order_by(AssetFundamental.reporting_date.desc()).all()
            except Exception as e:
                logger.warning(f"Failed to fetch/persist fundamentals for {symbol}: {e}")
                self.db.rollback()

        return funds

    def get_batch_fundamentals(
        self, asset_map: Dict[Union[uuid.UUID, str], str]
    ) -> Dict[uuid.UUID, List[AssetFundamental]]:
        """
        Batch retrieve fundamentals for multiple assets to prevent N+1 queries.
        `asset_map` maps asset_id -> symbol.
        """
        parsed_ids = {self._parse_asset_id(aid): (aid, sym) for aid, sym in asset_map.items()}
        if not parsed_ids:
            return {}

        records = self.db.query(AssetFundamental).filter(
            AssetFundamental.asset_id.in_(list(parsed_ids.keys()))
        ).order_by(AssetFundamental.reporting_date.desc()).all()

        results: Dict[uuid.UUID, List[AssetFundamental]] = {pid: [] for pid in parsed_ids}
        for rec in records:
            if rec.asset_id in results:
                results[rec.asset_id].append(rec)

        # For any asset with no cached data, fetch lazily
        for pid, (orig_id, symbol) in parsed_ids.items():
            if not results[pid]:
                results[pid] = self.get_asset_fundamentals(pid, symbol)

        return results

    def calculate_metrics(self, periods: List[AssetFundamental]) -> Dict[str, Any]:
        """
        Compute mathematically rigorous financial ratios from available observations.
        Avoids ZeroDivisionError and documents conventions for average balance sheet figures.
        """
        if not periods:
            return {}

        p0 = periods[0]
        p1 = periods[1] if len(periods) > 1 else None

        metrics: Dict[str, Any] = {}

        # 1. Growth Metrics (Requires consecutive periods)
        if p1 is not None:
            if p0.revenue is not None and p1.revenue is not None and p1.revenue > 0:
                metrics["revenue_growth"] = round((p0.revenue - p1.revenue) / p1.revenue, 4)
            if p0.net_income is not None and p1.net_income is not None and abs(p1.net_income) > 0:
                metrics["net_income_growth"] = round((p0.net_income - p1.net_income) / abs(p1.net_income), 4)
            if p0.eps is not None and p1.eps is not None and abs(p1.eps) > 0:
                metrics["eps_growth"] = round((p0.eps - p1.eps) / abs(p1.eps), 4)
            if p0.free_cash_flow is not None and p1.free_cash_flow is not None and abs(p1.free_cash_flow) > 0:
                metrics["fcf_growth"] = round((p0.free_cash_flow - p1.free_cash_flow) / abs(p1.free_cash_flow), 4)

        # 2. Profitability Metrics
        if p0.revenue is not None and p0.revenue > 0:
            if p0.gross_profit is not None:
                metrics["gross_margin"] = round(p0.gross_profit / p0.revenue, 4)
            if p0.operating_income is not None:
                metrics["operating_margin"] = round(p0.operating_income / p0.revenue, 4)
            if p0.net_income is not None:
                metrics["net_margin"] = round(p0.net_income / p0.revenue, 4)

        # ROE: Net Income / Average Equity (or Ending Equity if single period; documented convention)
        if p0.net_income is not None:
            if p1 is not None and p0.total_equity is not None and p1.total_equity is not None:
                avg_equity = (p0.total_equity + p1.total_equity) / 2.0
            else:
                avg_equity = p0.total_equity

            if avg_equity is not None and avg_equity > 0:
                metrics["roe"] = round(p0.net_income / avg_equity, 4)

        # ROA: Net Income / Average Assets (or Ending Assets if single period)
        if p0.net_income is not None:
            if p1 is not None and p0.total_assets is not None and p1.total_assets is not None:
                avg_assets = (p0.total_assets + p1.total_assets) / 2.0
            else:
                avg_assets = p0.total_assets

            if avg_assets is not None and avg_assets > 0:
                metrics["roa"] = round(p0.net_income / avg_assets, 4)

        # 3. Financial Health Metrics
        if p0.total_debt is not None and p0.total_equity is not None and p0.total_equity > 0:
            metrics["debt_to_equity"] = round(p0.total_debt / p0.total_equity, 4)

        if p0.cash_and_equivalents is not None and p0.total_debt is not None and p0.total_debt > 0:
            metrics["cash_to_debt"] = round(p0.cash_and_equivalents / p0.total_debt, 4)

        if p0.free_cash_flow is not None:
            metrics["free_cash_flow"] = round(p0.free_cash_flow, 2)

        # 4. Earnings Quality
        if p0.free_cash_flow is not None and p0.net_income is not None and p0.net_income > 0:
            metrics["fcf_conversion"] = round(p0.free_cash_flow / p0.net_income, 4)

        return metrics

    def evaluate_quality(
        self, fundamentals: Union[List[AssetFundamental], AssetFundamental, None]
    ) -> Dict[str, Any]:
        """
        Evaluate asset fundamental quality, calculate transparent multi-dimensional score,
        and generate explainable evidence-backed reasons and warnings.
        """
        if fundamentals is None:
            periods = []
        elif isinstance(fundamentals, list):
            periods = fundamentals
        else:
            periods = [fundamentals]

        if not periods:
            return {
                "status": "NOT_AVAILABLE",
                "score": 0.0,
                "quality": "INSUFFICIENT_DATA",
                "freshness": "UNAVAILABLE",
                "reporting_date": None,
                "metrics": {},
                "dimension_scores": {},
                "reasons": ["Fundamental data is unavailable for this asset."],
                "warnings": ["No financial statements on record."]
            }

        p0 = periods[0]
        metrics = self.calculate_metrics(periods)

        now = datetime.now(timezone.utc)
        rep_date_tz = p0.reporting_date.replace(tzinfo=timezone.utc) if p0.reporting_date.tzinfo is None else p0.reporting_date
        days_since_rep = (now - rep_date_tz).days
        freshness = "CURRENT" if days_since_rep <= 365 else "STALE"

        earned_points = 0.0
        max_points = 0.0
        dimension_scores: Dict[str, Any] = {}
        reasons: List[str] = []
        warnings: List[str] = []

        # ---------------------------------------------------------------------
        # Dimension 1: Growth (up to 25 pts)
        # ---------------------------------------------------------------------
        growth_earned = 0.0
        growth_max = 0.0

        if "revenue_growth" in metrics:
            growth_max += 15.0
            rev_g = metrics["revenue_growth"]
            if rev_g > 0.15:
                growth_earned += 15.0
                reasons.append(f"Strong revenue growth ({rev_g*100:.1f}% YoY)")
            elif rev_g > 0.05:
                growth_earned += 10.0
                reasons.append(f"Moderate revenue growth ({rev_g*100:.1f}% YoY)")
            elif rev_g >= 0.0:
                growth_earned += 5.0
            else:
                warnings.append(f"Contracting revenue ({rev_g*100:.1f}% YoY)")

        if "eps_growth" in metrics:
            growth_max += 10.0
            eps_g = metrics["eps_growth"]
            if eps_g > 0.10:
                growth_earned += 10.0
                reasons.append(f"Robust EPS growth ({eps_g*100:.1f}% YoY)")
            elif eps_g > 0.0:
                growth_earned += 5.0
            else:
                warnings.append(f"Negative EPS growth ({eps_g*100:.1f}% YoY)")

        if growth_max > 0:
            dimension_scores["growth"] = {"earned": growth_earned, "max": growth_max}
            earned_points += growth_earned
            max_points += growth_max

        # ---------------------------------------------------------------------
        # Dimension 2: Profitability (up to 30 pts)
        # ---------------------------------------------------------------------
        prof_earned = 0.0
        prof_max = 0.0

        if "operating_margin" in metrics:
            prof_max += 15.0
            op_m = metrics["operating_margin"]
            if op_m > 0.20:
                prof_earned += 15.0
                reasons.append(f"High operating margin ({op_m*100:.1f}%)")
            elif op_m > 0.10:
                prof_earned += 10.0
                reasons.append(f"Solid operating margin ({op_m*100:.1f}%)")
            elif op_m > 0.0:
                prof_earned += 5.0
            else:
                warnings.append("Operating loss (negative operating margin)")

        if "roe" in metrics:
            prof_max += 15.0
            roe = metrics["roe"]
            if roe > 0.18:
                prof_earned += 15.0
                reasons.append(f"Superior Return on Equity ({roe*100:.1f}%)")
            elif roe > 0.10:
                prof_earned += 10.0
                reasons.append(f"Healthy Return on Equity ({roe*100:.1f}%)")
            elif roe > 0.0:
                prof_earned += 5.0
            else:
                warnings.append("Negative Return on Equity")

        if prof_max > 0:
            dimension_scores["profitability"] = {"earned": prof_earned, "max": prof_max}
            earned_points += prof_earned
            max_points += prof_max

        # ---------------------------------------------------------------------
        # Dimension 3: Financial Health (up to 25 pts)
        # ---------------------------------------------------------------------
        health_earned = 0.0
        health_max = 0.0

        if "debt_to_equity" in metrics:
            health_max += 15.0
            dte = metrics["debt_to_equity"]
            if dte < 0.50:
                health_earned += 15.0
                reasons.append(f"Low balance sheet leverage (Debt/Equity: {dte:.2f})")
            elif dte < 1.20:
                health_earned += 10.0
            elif dte <= 2.0:
                health_earned += 5.0
            else:
                warnings.append(f"High financial leverage (Debt/Equity: {dte:.2f})")

        if "cash_to_debt" in metrics:
            health_max += 10.0
            ctd = metrics["cash_to_debt"]
            if ctd > 1.0:
                health_earned += 10.0
                reasons.append("Net cash balance sheet (Cash exceeds total debt)")
            elif ctd > 0.4:
                health_earned += 5.0
            else:
                health_earned += 2.0

        # Equity check for warnings
        if p0.total_equity is not None and p0.total_equity < 0:
            warnings.append("Negative stockholders equity indicates balance sheet deficit")

        if health_max > 0:
            dimension_scores["financial_health"] = {"earned": health_earned, "max": health_max}
            earned_points += health_earned
            max_points += health_max

        # ---------------------------------------------------------------------
        # Dimension 4: Cash Flow & Earnings Quality (up to 20 pts)
        # ---------------------------------------------------------------------
        cf_earned = 0.0
        cf_max = 0.0

        if "fcf_conversion" in metrics:
            cf_max += 12.0
            conv = metrics["fcf_conversion"]
            if conv > 0.85:
                cf_earned += 12.0
                reasons.append(f"High cash conversion quality (FCF is {conv*100:.1f}% of net income)")
            elif conv > 0.50:
                cf_earned += 8.0
            elif conv > 0.0:
                cf_earned += 4.0
            else:
                warnings.append("Net income not backed by positive Free Cash Flow")

        if "free_cash_flow" in metrics:
            cf_max += 8.0
            fcf = metrics["free_cash_flow"]
            if fcf > 0:
                cf_earned += 8.0
                reasons.append("Positive free cash flow generation")
            else:
                warnings.append("Negative free cash flow burn")

        if cf_max > 0:
            dimension_scores["earnings_quality"] = {"earned": cf_earned, "max": cf_max}
            earned_points += cf_earned
            max_points += cf_max

        # ---------------------------------------------------------------------
        # Final Score Normalization & Qualitative Classification
        # ---------------------------------------------------------------------
        if max_points == 0:
            # When statement observations exist but inputs are all null or zero denominators
            return {
                "status": "AVAILABLE",
                "score": 0.0,
                "quality": "INSUFFICIENT_DATA",
                "freshness": freshness,
                "reporting_date": p0.reporting_date.isoformat(),
                "metrics": metrics,
                "dimension_scores": dimension_scores,
                "reasons": reasons or ["Statement on file but key analytical fields could not be computed."],
                "warnings": warnings or ["Insufficient data fields to calculate fundamental score."]
            }

        final_score = round((earned_points / max_points) * 100.0, 1)

        if final_score >= 70.0:
            quality = "STRONG"
        elif final_score >= 40.0:
            quality = "MODERATE"
        else:
            quality = "WEAK"

        status = "AVAILABLE" if max_points >= 40.0 else "PARTIALLY_AVAILABLE"

        return {
            "status": status,
            "score": final_score,
            "quality": quality,
            "freshness": freshness,
            "reporting_date": p0.reporting_date.isoformat(),
            "metrics": metrics,
            "dimension_scores": dimension_scores,
            "reasons": reasons,
            "warnings": warnings
        }
