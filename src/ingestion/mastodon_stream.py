import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Optional
import httpx
from src.core.schemas import RawSocialEvent
from src.ingestion.base import BaseStreamConsumer
from src.ingestion.producer import KafkaEventProducer

logger = logging.getLogger("comintel.ingestion.mastodon")

class MastodonStreamConsumer(BaseStreamConsumer):
    """
    Consumes public streaming posts from Mastodon instance SSE endpoint
    and routes them into Kafka topic 'social.raw'.
    """
    def __init__(self, instance_url: str = "https://mastodon.social", producer: Optional[KafkaEventProducer] = None):
        self.instance_url = instance_url.rstrip("/")
        self.producer = producer or KafkaEventProducer.get_instance()
        self.running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._stream_loop())

    async def stop(self):
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _stream_loop(self):
        url = f"{self.instance_url}/api/v1/streaming/public"
        backoff = 2.0
        while self.running:
            try:
                async with httpx.AsyncClient(timeout=None) as client:
                    async with client.stream("GET", url) as response:
                        if response.status_code != 200:
                            logger.warning("Mastodon stream returned status %d. Backing off...", response.status_code)
                            await asyncio.sleep(backoff)
                            backoff = min(backoff * 2, 60.0)
                            continue

                        backoff = 2.0
                        async for line in response.aiter_lines():
                            if not self.running:
                                break
                            if line.startswith("data: "):
                                try:
                                    payload = json.loads(line[6:])
                                    content = payload.get("content", "")
                                    if content:
                                        event = RawSocialEvent(
                                            source="mastodon",
                                            source_event_id=str(payload.get("id", "")),
                                            author_id=str(payload.get("account", {}).get("acct", "unknown")),
                                            timestamp=datetime.now(timezone.utc),
                                            text=content,
                                            raw_payload=payload
                                        )
                                        await self.producer.send("social.raw", key=event.author_id, value=event.dict())
                                except Exception:
                                    pass
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.debug("Mastodon stream disconnected: %s. Reconnecting in %.1fs...", e, backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60.0)
