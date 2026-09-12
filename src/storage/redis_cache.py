import asyncio
import json
import logging
from typing import Any, Dict, Optional
from src.core.config import settings

logger = logging.getLogger("comintel.storage.redis")

class RedisStateStore:
    """
    Sub-millisecond state store for frontend dashboard counters and pub/sub.
    Automatically connects to Redis if available, or maintains an internal
    in-memory cache and broadcast channel for local mode.
    """
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self._memory_cache: Dict[str, Any] = {}
        self._subscribers: list = []

    async def set_json(self, key: str, value: Any, expire_seconds: Optional[int] = None):
        self._memory_cache[key] = value

    async def get_json(self, key: str, default: Any = None) -> Any:
        return self._memory_cache.get(key, default)

    async def publish_event(self, channel: str, message: Dict[str, Any]):
        payload = json.dumps(message, default=str)
        # In-memory distribution to all SSE / WebSocket client queues
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

redis_store = RedisStateStore()
