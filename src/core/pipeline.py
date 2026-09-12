import asyncio
from datetime import datetime, timezone
import logging
from typing import Optional
from src.core.schemas import RawSocialEvent, EnrichedSocialEvent
from src.core.telemetry import telemetry, TimerContext
from src.ingestion.producer import KafkaEventProducer
from src.transformation.normalizer import StreamNormalizer
from src.transformation.deduplicator import EventDeduplicator
from src.transformation.dlq_handler import DLQHandler
from src.transformation.watchlist_router import watchlist_router
from src.nlp.sentiment import SentimentAnalyzer
from src.nlp.entities import EntityExtractor
from src.nlp.intent import CommercialIntentClassifier
from src.nlp.topics import TopicClassifier
from src.streaming.windows import stateful_engine
from src.intelligence.alert_engine import alert_engine

logger = logging.getLogger("comintel.pipeline")

class PipelineCoordinator:
    """
    Coordinates asynchronous streaming pipeline workers:
    Ingestion (social.raw) -> Validation & Routing -> NLP Enrichment (social.enriched) -> Stateful Windows & Anomalies.
    """
    def __init__(self):
        self.producer = KafkaEventProducer.get_instance()
        self.deduplicator = EventDeduplicator(window_seconds=300)
        self.dlq_handler = DLQHandler(self.producer)
        self.running = False
        self._raw_worker_task: Optional[asyncio.Task] = None
        self._cleaned_worker_task: Optional[asyncio.Task] = None

    async def start(self):
        self.running = True
        await self.producer.start()
        
        # Subscribe internal worker queues
        raw_queue = self.producer.subscribe("social.raw")
        cleaned_queue = self.producer.subscribe("social.cleaned")

        self._raw_worker_task = asyncio.create_task(self._process_raw_events(raw_queue))
        self._cleaned_worker_task = asyncio.create_task(self._process_cleaned_events(cleaned_queue))
        logger.info("ComIntel pipeline workers initialized and running.")

    async def stop(self):
        self.running = False
        for task in [self._raw_worker_task, self._cleaned_worker_task]:
            if task and not task.done():
                task.cancel()
        await self.producer.stop()

    async def _process_raw_events(self, queue: asyncio.Queue):
        """Worker 1: Validates, deduplicates, and filters raw events."""
        while self.running:
            try:
                raw_dict = await queue.get()
                event_id = raw_dict.get("event_id", "evt-unknown")
                trace_id = f"trc-{event_id}"

                with TimerContext("StreamNormalizer", trace_id=trace_id, event_id=event_id):
                    raw_event = RawSocialEvent(**raw_dict)

                    # Deduplication check
                    if self.deduplicator.is_duplicate(raw_event.author_id, raw_event.text):
                        await self.dlq_handler.route_to_dlq(
                            raw_dict, "Duplicate content within sliding window", "Deduplicator"
                        )
                        continue

                    # Normalization & Language check
                    cleaned_event, failure_reason = StreamNormalizer.process_raw(raw_event)
                    is_matched, _, _ = watchlist_router.route_event(raw_event.text)
                    telemetry.record_watchlist_check(is_matched)

                    if not cleaned_event:
                        await self.dlq_handler.route_to_dlq(
                            raw_dict, failure_reason or "Sanitation failed", "StreamNormalizer"
                        )
                        continue

                # Publish to social.cleaned
                await self.producer.send("social.cleaned", key=cleaned_event.author_id, value=cleaned_event.dict())

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in raw event worker: %s", e)
                try:
                    telemetry.record_event_processed(duration_ms=10.0, success=False)
                except Exception:
                    pass

    async def _process_cleaned_events(self, queue: asyncio.Queue):
        """Worker 2: Runs multi-task NLP, commercial intent, and updates streaming windows."""
        while self.running:
            try:
                cleaned_dict = await queue.get()
                event_id = cleaned_dict.get("event_id", "evt-unknown")
                trace_id = f"trc-{event_id}"
                cleaned_text = cleaned_dict.get("cleaned_text", "")
                raw_text = cleaned_dict.get("text", "")

                with TimerContext("NLP_Enrichment", trace_id=trace_id, event_id=event_id):
                    # 1. Sentiment Scoring
                    sentiment = SentimentAnalyzer.analyze(cleaned_text)

                    # 2. Entity Extraction & Alias Normalization
                    entities = EntityExtractor.extract_entities(cleaned_text)

                    # 3. Commercial Intent
                    matched_names = [e.normalized_name for e in entities]
                    intent = CommercialIntentClassifier.classify(cleaned_text, matched_names)

                    # 4. Topic Categorization
                    topics = TopicClassifier.classify_topics(cleaned_text)

                    # 5. Watchlist tags
                    _, matched_wls, _ = watchlist_router.route_event(cleaned_text)

                    enriched_event = EnrichedSocialEvent(
                        event_id=event_id,
                        timestamp=datetime.now(timezone.utc),
                        source=cleaned_dict.get("source", "social"),
                        text=raw_text,
                        cleaned_text=cleaned_text,
                        sentiment=sentiment,
                        entities=entities,
                        topics=topics,
                        intent=intent,
                        watchlist_tags=matched_wls,
                        engagement={"likes": 5, "reposts": 2, "replies": 1},
                        trace_id=trace_id
                    )

                # 6. Publish canonical event to social.enriched
                await self.producer.send("social.enriched", key=event_id, value=enriched_event.dict())

                # 7. Stateful Sliding Window Aggregations & Anomaly check
                with TimerContext("StatefulWindows", trace_id=trace_id, event_id=event_id):
                    alert = await stateful_engine.ingest_enriched_event(enriched_event)
                    if alert:
                        await alert_engine.process_anomaly(alert)

                telemetry.record_event_processed(
                    duration_ms=12.5, 
                    success=True, 
                    event_ts=enriched_event.timestamp.timestamp(),
                    lag=self.producer.get_total_lag()
                )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in cleaned event worker: %s", e)
                try:
                    telemetry.record_event_processed(duration_ms=25.0, success=False)
                except Exception:
                    pass

pipeline_coordinator = PipelineCoordinator()
