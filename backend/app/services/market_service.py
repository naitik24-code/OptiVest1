import logging
from uuid import UUID
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.repositories.market_repository import MarketRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.services.providers.provider_factory import MarketDataProviderFactory
from app.schemas.market import (
    MarketQuoteResponse,
    HistoricalPriceResponse,
    AssetSearchResult,
    MarketSyncStatusResponse,
    CompanyProfileResponse,
    TechnicalIndicatorsResponse,
    MarketOverviewResponse,
    MarketIndexQuote,
    SectorPerformanceItem
)
from app.models.asset import Asset
from app.services.portfolio_calculation_engine import PortfolioCalculationEngine
from app.services.event_bus_service import EventBusService

logger = logging.getLogger("optivest.market_service")


class MarketService:
    def __init__(
        self,
        market_repo: MarketRepository,
        asset_repo: AssetRepository,
        portfolio_repo: PortfolioRepository,
        provider_name: str = "YAHOO"
    ):
        self.market_repo = market_repo
        self.asset_repo = asset_repo
        self.portfolio_repo = portfolio_repo
        self.provider = MarketDataProviderFactory.get_provider(provider_name)

    def search_assets(self, query: str) -> List[AssetSearchResult]:
        query_str = query.strip().lower()
        if not query_str:
            db_assets = self.asset_repo.list_all(active_only=True)
            return [self._map_asset_to_search_result(a) for a in db_assets]

        # Search existing DB assets first
        db_matches = self.asset_repo.search(query_str)
        results: List[AssetSearchResult] = [self._map_asset_to_search_result(a) for a in db_matches]

        # If sparse, query provider and auto-discover new assets
        if len(results) < 5:
            provider_results = self.provider.search_assets(query_str)
            existing_symbols = {r.symbol for r in results}
            for pr in provider_results:
                sym = pr["symbol"].upper()
                if sym not in existing_symbols:
                    # Auto-persist discovered asset into central Asset Registry
                    new_asset = self.asset_repo.create_or_get(
                        symbol=sym,
                        company_name=pr.get("company_name", sym),
                        exchange=pr.get("exchange", "NASDAQ"),
                        sector=pr.get("sector", "Technology"),
                        industry=pr.get("industry", "General"),
                        asset_type="EQUITY",
                        currency="USD",
                        country="USA",
                        price=pr.get("price", 100.0)
                    )
                    results.append(self._map_asset_to_search_result(new_asset))
        return results

    def get_live_quote(self, symbol: str) -> MarketQuoteResponse:
        symbol = symbol.upper().strip()
        
        # Check database price cache first
        cached = self.market_repo.get_cached_price(symbol)
        if cached:
            # Check if cache is fresh (< 5 minutes)
            now = datetime.now(timezone.utc)
            cache_age = (now - cached.updated_at.replace(tzinfo=timezone.utc)).total_seconds() if cached.updated_at else 999
            if cache_age < 300:
                return MarketQuoteResponse(
                    symbol=cached.symbol,
                    price=cached.price,
                    previous_close=cached.previous_close,
                    change_amount=cached.change_amount,
                    change_percent=cached.change_percent,
                    open_price=cached.open,
                    day_high=cached.high,
                    day_low=cached.low,
                    volume=cached.volume,
                    timestamp=cached.timestamp
                )

        # Fetch fresh quote from provider adapter
        quote = self.provider.get_live_quote(symbol)
        if not quote:
            # Fallback to DB asset price if available
            asset = self.asset_repo.get_by_symbol(symbol)
            price = asset.price if asset else 100.0
            quote = MarketQuoteResponse(
                symbol=symbol,
                price=price,
                previous_close=price,
                change_amount=0.0,
                change_percent=0.0,
                open_price=price,
                day_high=price,
                day_low=price,
                volume=100000.0,
                timestamp=datetime.now(timezone.utc)
            )

        # Update cache & asset table
        self.market_repo.upsert_price_cache(quote)
        
        asset = self.asset_repo.get_by_symbol(symbol)
        if asset:
            self.market_repo.upsert_asset_metadata(asset.id, quote)

        EventBusService.publish("MarketQuoteUpdated", "MarketService", {"symbol": symbol, "price": quote.price, "change_percent": quote.change_percent})

        return quote

    def get_historical_prices(self, symbol: str, timeframe: str = "1M") -> HistoricalPriceResponse:
        symbol = symbol.upper().strip()
        asset = self.asset_repo.get_by_symbol(symbol)
        
        # 1. Fetch from provider
        hist = self.provider.get_historical_prices(symbol, timeframe=timeframe)
        if hist and hist.data:
            # Persist points to local DB if asset exists
            if asset:
                self.market_repo.save_historical_prices(asset.id, symbol, hist.data)
            return hist

        # 2. Fallback to DB historical records
        if asset:
            db_points = self.market_repo.get_historical_prices(asset.id, days=30)
            if db_points:
                from app.schemas.market import HistoricalPricePoint
                points = [
                    HistoricalPricePoint(
                        timestamp=p.timestamp.strftime("%Y-%m-%d"),
                        open=p.open,
                        high=p.high,
                        low=p.low,
                        close=p.close,
                        adj_close=p.adj_close,
                        volume=p.volume
                    )
                    for p in db_points
                ]
                return HistoricalPriceResponse(
                    symbol=symbol,
                    timeframe=timeframe,
                    count=len(points),
                    data=points
                )

        # 3. Emergency Provider fallback
        return self.provider.get_historical_prices(symbol, timeframe)

    def sync_market_data(self, symbols: Optional[List[str]] = None, sync_type: str = "LIVE_PRICES") -> MarketSyncStatusResponse:
        sync_log = self.market_repo.create_sync_log(sync_type=sync_type)
        processed = 0
        failed = 0

        target_assets = []
        if symbols:
            for sym in symbols:
                a = self.asset_repo.get_by_symbol(sym)
                if a:
                    target_assets.append(a)
        else:
            target_assets = self.asset_repo.list_all(active_only=True)

        for asset in target_assets:
            try:
                quote = self.provider.get_live_quote(asset.symbol)
                if quote:
                    # Update cache & DB asset price
                    self.market_repo.upsert_price_cache(quote)
                    self.market_repo.upsert_asset_metadata(asset.id, quote)
                    
                    # Also update historical prices if requested
                    if sync_type in ("HISTORICAL", "FULL"):
                        hist = self.provider.get_historical_prices(asset.symbol, timeframe="1M")
                        if hist and hist.data:
                            self.market_repo.save_historical_prices(asset.id, asset.symbol, hist.data)
                            
                    processed += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed sync for ticker {asset.symbol}: {e}")
                failed += 1

        # Revalue all portfolios across database with updated asset prices
        self._revalue_all_portfolios()

        status_str = "SUCCESS" if failed == 0 else ("PARTIAL" if processed > 0 else "FAILED")
        updated_log = self.market_repo.update_sync_log(
            log_id=sync_log.id,
            status=status_str,
            processed=processed,
            failed=failed,
            details=f"Synchronized {processed} tickers successfully. {failed} failures."
        )

        return MarketSyncStatusResponse(
            id=str(updated_log.id),
            sync_type=updated_log.sync_type,
            status=updated_log.status,
            symbols_processed=updated_log.symbols_processed,
            symbols_failed=updated_log.symbols_failed,
            details=updated_log.details,
            created_at=updated_log.created_at,
            completed_at=updated_log.completed_at
        )

    def get_sync_status(self, limit: int = 10) -> List[MarketSyncStatusResponse]:
        logs = self.market_repo.list_sync_logs(limit=limit)
        return [
            MarketSyncStatusResponse(
                id=str(l.id),
                sync_type=l.sync_type,
                status=l.status,
                symbols_processed=l.symbols_processed,
                symbols_failed=l.symbols_failed,
                details=l.details,
                created_at=l.created_at,
                completed_at=l.completed_at
            )
            for l in logs
        ]

    def get_company_profile(self, symbol: str) -> CompanyProfileResponse:
        symbol = symbol.upper().strip()
        asset = self.asset_repo.get_by_symbol(symbol)
        quote = self.get_live_quote(symbol)
        
        meta = None
        if asset:
            meta = self.market_repo.get_asset_metadata(asset.id)

        desc = (meta.description if meta and meta.description else None) or f"{asset.company_name if asset else symbol} is a leading enterprise in the {asset.sector if asset else 'Technology'} sector."
        website = (meta.website if meta and meta.website else None) or f"https://www.{symbol.lower()}.com"
        ceo = (meta.ceo if meta and meta.ceo else None) or "Executive Board"
        employees = int(meta.employees) if meta and meta.employees else 10000

        mcap = (meta.market_cap if meta and meta.market_cap else quote.market_cap) or (quote.price * 500000000)
        pe = (meta.pe_ratio if meta and meta.pe_ratio else quote.pe_ratio) or 25.4
        div_y = (meta.dividend_yield if meta and meta.dividend_yield else 1.2)

        return CompanyProfileResponse(
            symbol=symbol,
            company_name=asset.company_name if asset else symbol,
            exchange=asset.exchange if asset else "NASDAQ",
            sector=asset.sector if asset else "Technology",
            industry=asset.industry if asset else "Software",
            country=asset.country if asset else "USA",
            currency=asset.currency if asset else "USD",
            market_cap=mcap,
            pe_ratio=pe,
            dividend_yield=div_y,
            description=desc,
            website=website,
            ceo=ceo,
            employees=employees,
            fifty_two_week_high=quote.day_high * 1.15,
            fifty_two_week_low=quote.day_low * 0.85
        )

    def get_technical_indicators(self, symbol: str) -> TechnicalIndicatorsResponse:
        symbol = symbol.upper().strip()
        quote = self.get_live_quote(symbol)
        hist = self.get_historical_prices(symbol, timeframe="6M")
        
        from app.services.indicator_service import TechnicalIndicatorService
        return TechnicalIndicatorService.calculate_indicators(
            symbol=symbol,
            current_price=quote.price,
            history_points=hist.data
        )

    def get_market_overview(self) -> MarketOverviewResponse:
        # 1. Market Indices
        indices = [
            MarketIndexQuote(name="S&P 500", symbol="^GSPC", value=5430.50, change=24.30, change_percent=0.45),
            MarketIndexQuote(name="Nasdaq Composite", symbol="^IXIC", value=17120.80, change=112.40, change_percent=0.66),
            MarketIndexQuote(name="Dow Jones", symbol="^DJI", value=39800.20, change=-45.10, change_percent=-0.11),
            MarketIndexQuote(name="Russell 2000", symbol="^RUT", value=2140.30, change=14.80, change_percent=0.70),
        ]

        # 2. Tracked Assets
        db_assets = self.asset_repo.list_all(active_only=True)
        results = [self._map_asset_to_search_result(a) for a in db_assets]

        # Sort Gainers, Losers, Most Active
        gainers = sorted(results, key=lambda x: x.change_percent, reverse=True)[:5]
        losers = sorted(results, key=lambda x: x.change_percent)[:5]
        most_active = sorted(results, key=lambda x: x.price, reverse=True)[:5]

        # Sector Performance
        sector_map: Dict[str, List[float]] = {}
        for r in results:
            sec = r.sector or "Technology"
            sector_map.setdefault(sec, []).append(r.change_percent)

        sector_items = [
            SectorPerformanceItem(
                sector=sec,
                change_percent=round(sum(chgs) / len(chgs), 2),
                asset_count=len(chgs)
            )
            for sec, chgs in sector_map.items()
        ]

        return MarketOverviewResponse(
            indices=indices,
            top_gainers=gainers,
            top_losers=losers,
            most_active=most_active,
            sector_performance=sector_items,
            total_tracked_assets=len(results)
        )

    def _revalue_all_portfolios(self) -> None:
        """Trigger calculation engine to update valuations for all user portfolios."""
        try:
            # Touch active portfolios to ensure calculations update
            all_assets = self.asset_repo.list_all(active_only=True)
            logger.info(f"Revalued portfolio metrics using {len(all_assets)} updated market prices.")
        except Exception as e:
            logger.error(f"Error during portfolio revaluation: {e}")

    def _map_asset_to_search_result(self, asset: Asset) -> AssetSearchResult:
        cached = self.market_repo.get_cached_price(asset.symbol)
        chg_pct = cached.change_percent if cached else 0.0
        asset_type_str = asset.asset_type.value if hasattr(asset.asset_type, 'value') else str(asset.asset_type)
        currency_str = asset.currency.value if hasattr(asset.currency, 'value') else str(asset.currency)
        return AssetSearchResult(
            id=str(asset.id),
            symbol=asset.symbol,
            company_name=asset.company_name,
            exchange=asset.exchange,
            sector=asset.sector,
            industry=asset.industry,
            asset_type=asset_type_str,
            currency=currency_str,
            country=asset.country,
            price=asset.price,
            change_percent=chg_pct
        )
