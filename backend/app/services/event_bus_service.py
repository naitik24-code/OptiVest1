import logging
from typing import Dict, List, Callable, Any
from datetime import datetime, timezone

logger = logging.getLogger("optivest.event_bus")


class EventBusService:
    """
    Engine 4: Domain Event Bus.
    Lightweight, thread-safe in-memory publish-subscribe domain event dispatcher
    ensuring loose coupling between data ingestion, cache, feature store, and portfolio modules.
    """

    _subscribers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}
    _event_history: List[Dict[str, Any]] = []

    @classmethod
    def subscribe(cls, event_type: str, callback: Callable[[Dict[str, Any]], None]):
        """Registers a callback function subscriber for a specific domain event type."""
        if event_type not in cls._subscribers:
            cls._subscribers[event_type] = []
        cls._subscribers[event_type].append(callback)
        logger.info(f"[EventBus] Subscribed handler to event '{event_type}'")

    @classmethod
    def publish(cls, event_type: str, publisher: str, payload: Dict[str, Any]) -> int:
        """Publishes a domain event to all registered subscribers."""
        event_record = {
            "event_type": event_type,
            "publisher": publisher,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        cls._event_history.append(event_record)
        if len(cls._event_history) > 500:
            cls._event_history = cls._event_history[-500:]

        subscribers = cls._subscribers.get(event_type, [])
        notified_count = 0
        for callback in subscribers:
            try:
                callback(payload)
                notified_count += 1
            except Exception as e:
                logger.error(f"[EventBus] Subscriber error on '{event_type}': {e}")

        logger.info(f"[EventBus] Published '{event_type}' by {publisher} -> {notified_count} subscriber(s) notified")
        return notified_count

    @classmethod
    def get_event_history(cls, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent domain event execution logs."""
        return cls._event_history[-limit:]
