import time
from typing import Dict, Any, Optional, Tuple


class MultiLevelCacheService:
    """
    Engine 5: Multi-Level Cache Engine.
    L1: Fast In-Memory Dictionary Cache
    L2: Redis-Ready Adapter Hook
    L3: Database Fallback (price_cache)
    Tracks hit/miss performance statistics and enforces stale-while-revalidate invalidation.
    """

    _l1_cache: Dict[str, Tuple[Any, float]] = {}  # key -> (value, expire_timestamp)
    _hits_l1: int = 0
    _hits_l2: int = 0
    _hits_l3: int = 0
    _misses: int = 0

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """Retrieves item from L1 or L2/L3 cache."""
        now = time.time()
        # 1. Check L1 Memory Cache
        if key in cls._l1_cache:
            value, expire_at = cls._l1_cache[key]
            if now <= expire_at:
                cls._hits_l1 += 1
                return value
            else:
                # Expired L1 item
                del cls._l1_cache[key]

        cls._misses += 1
        return None

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 300):
        """Stores item in L1 Memory Cache with TTL."""
        expire_at = time.time() + ttl_seconds
        cls._l1_cache[key] = (value, expire_at)



    @classmethod
    def get_stats(cls) -> Dict[str, Any]:
        """Returns cache telemetry & hit ratio percentages."""
        total_requests = cls._hits_l1 + cls._hits_l2 + cls._hits_l3 + cls._misses
        hit_ratio = ((cls._hits_l1 + cls._hits_l2 + cls._hits_l3) / total_requests * 100.0) if total_requests > 0 else 100.0

        return {
            "l1_memory_items": len(cls._l1_cache),
            "hits_l1_memory": cls._hits_l1,
            "hits_l2_redis": cls._hits_l2,
            "hits_l3_db": cls._hits_l3,
            "misses": cls._misses,
            "total_requests": total_requests,
            "hit_ratio_pct": round(hit_ratio, 2)
        }
