from typing import List, Dict, Any
from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.schemas.portfolio import PortfolioSummaryMetrics
from app.schemas.holding import HoldingResponse


class PortfolioCalculationEngine:
    """Quantitative Calculation Engine for Portfolio valuation and metrics."""

    @staticmethod
    def calculate_portfolio_metrics(portfolio: Portfolio) -> Dict[str, Any]:
        holdings: List[Holding] = portfolio.holdings or []
        
        total_invested = 0.0
        total_market_value = 0.0
        calculated_holdings: List[HoldingResponse] = []

        for h in holdings:
            asset = h.asset
            current_price = asset.price if (asset and asset.price > 0) else h.average_buy_price
            
            book_val = round(h.quantity * h.average_buy_price, 2)
            mkt_val = round(h.quantity * current_price, 2)
            pnl = round(mkt_val - book_val, 2)
            pnl_pct = round((pnl / book_val * 100), 2) if book_val > 0 else 0.0

            total_invested += book_val
            total_market_value += mkt_val

            holding_dto = HoldingResponse(
                id=h.id,
                portfolio_id=h.portfolio_id,
                asset_id=h.asset_id,
                quantity=h.quantity,
                average_buy_price=h.average_buy_price,
                book_value=book_val,
                market_value=mkt_val,
                unrealized_pnl=pnl,
                unrealized_pnl_pct=pnl_pct,
                created_at=h.created_at,
                updated_at=h.updated_at,
                asset=h.asset
            )
            calculated_holdings.append(holding_dto)

        profit_loss = round(total_market_value - total_invested, 2)
        portfolio_return_pct = round((profit_loss / total_invested * 100), 2) if total_invested > 0 else 0.0

        metrics = PortfolioSummaryMetrics(
            portfolio_value=round(total_market_value, 2),
            total_invested=round(total_invested, 2),
            book_value=round(total_invested, 2),
            market_value=round(total_market_value, 2),
            profit_loss=profit_loss,
            profit_loss_pct=portfolio_return_pct,
            cash_balance=0.0,
            holdings_count=len(holdings),
            assets_count=len(set(h.asset_id for h in holdings)),
            portfolio_return_pct=portfolio_return_pct
        )

        return {
            "metrics": metrics,
            "calculated_holdings": calculated_holdings
        }
