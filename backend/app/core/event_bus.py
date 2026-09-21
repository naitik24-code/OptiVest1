import asyncio
import logging
from typing import Callable, Dict, List, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.autonomous import EventStream
from app.core.websocket import websocket_manager

logger = logging.getLogger(__name__)

class EventBus:
    """
    Centralized Domain Event Bus.
    All modules must communicate through events (Module 2).
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        logger.info(f"Subscribed to event: {event_type}")

    async def publish(self, event_type: str, payload: dict):
        logger.info(f"Publishing event: {event_type}")
        
        # 1. Persist to EventStream for Command Center history
        db = SessionLocal()
        try:
            event_record = EventStream(
                event_type=event_type,
                payload=payload,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(event_record)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to persist event {event_type}: {e}")
        finally:
            db.close()

        # 2. Emit to WebSocket frontend (Module 9)
        asyncio.create_task(websocket_manager.broadcast({
            "type": "DOMAIN_EVENT",
            "event_type": event_type,
            "data": payload
        }))

        # 3. Trigger all backend subscribers
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        asyncio.create_task(callback(payload))
                    else:
                        # Run sync callbacks in a thread pool to avoid blocking the event loop
                        asyncio.create_task(asyncio.to_thread(callback, payload))
                except Exception as e:
                    logger.error(f"Error executing callback for {event_type}: {e}")

event_bus = EventBus()

# Required Domain Events:
# MarketDataUpdated
# PredictionGenerated
# PortfolioChanged
# DecisionGenerated
# DecisionAccepted
# TradeExecuted
# ModelDriftDetected
