import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Optional
import websockets
from src.core.config import settings
from src.core.schemas import RawSocialEvent
from src.core.telemetry import telemetry
from src.ingestion.base import BaseStreamConsumer
from src.ingestion.producer import KafkaEventProducer

logger = logging.getLogger("comintel.ingestion.bluesky")

class BlueskyJetstreamConsumer(BaseStreamConsumer):
    """
    Consumes live post commitments from Bluesky Jetstream WebSocket firehose
    and publishes raw events to Kafka topic 'social.raw'.
    """
    DEFAULT_JETSTREAM_URL = "wss://jetstream1.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"

    def __init__(self, producer: Optional[KafkaEventProducer] = None, cursor: Optional[int] = None):
        self.producer = producer or KafkaEventProducer.get_instance()
        self.cursor = cursor
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self.events_received = 0

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._consume_loop())

    async def stop(self):
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _consume_loop(self):
        url = settings.JETSTREAM_URL or self.DEFAULT_JETSTREAM_URL
        if self.cursor:
            url = f"{url}&cursor={self.cursor}"

        backoff = 1.0
        while self.running:
            try:
                logger.info("Connecting to Bluesky Jetstream: %s", url)
                async with websockets.connect(
                    url, 
                    ping_interval=20, 
                    ping_timeout=15, 
                    close_timeout=5
                ) as ws:
                    backoff = 1.0
                    logger.info("Connected to Bluesky Jetstream successfully.")
                    async for message in ws:
                        if not self.running:
                            break
                        
                        try:
                            telemetry.record_ingress_event()
                            data = json.loads(message)
                            event = self.parse_message(data)
                            if event:
                                self.events_received += 1
                                if "time_us" in data:
                                    self.cursor = data["time_us"]
                                await self.producer.send(
                                    "social.raw",
                                    key=event.author_id,
                                    value=event.dict()
                                )
                        except Exception as parse_err:
                            logger.debug("Failed parsing Jetstream message: %s", parse_err)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("Bluesky Jetstream connection error: %s. Reconnecting in %.1fs...", e, backoff)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30.0)

    @classmethod
    def parse_message(cls, data: dict) -> Optional[RawSocialEvent]:
        """Parses a raw Jetstream JSON envelope into a canonical RawSocialEvent."""
        kind = data.get("kind")
        commit = data.get("commit", {})
        collection = commit.get("collection")
        
        if kind == "commit" and collection == "app.bsky.feed.post":
            record = commit.get("record", {})
            text = record.get("text", "")
            if not text:
                return None
                
            created_at_str = record.get("createdAt")
            if created_at_str:
                try:
                    ts = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)
            else:
                ts = datetime.now(timezone.utc)

            return RawSocialEvent(
                source="bluesky",
                source_event_id=commit.get("rkey", ""),
                author_id=data.get("did", "anonymous"),
                timestamp=ts,
                text=text,
                raw_payload=data
            )
        return None
