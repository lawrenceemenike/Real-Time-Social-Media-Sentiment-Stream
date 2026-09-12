import asyncio
from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.streaming.aggregations import AnalyticalAggregator
from src.streaming.windows import stateful_engine
from src.streaming.replay import replayer
from src.storage.postgres_client import db_client
from src.storage.redis_cache import redis_store
from src.core.telemetry import telemetry
from src.intelligence.narrative_agent import narrative_agent

logger = logging.getLogger("comintel.api.routes")
router = APIRouter(prefix="/api/v1")

class AIQueryRequest(BaseModel):
    query: str

class ReplayRequest(BaseModel):
    speed: float = 10.0

@router.get("/metrics/summary")
async def get_summary_metrics():
    """Returns top KPI cards metrics (Mentions, Net Sentiment, Negative Mentions, Engagement)."""
    return AnalyticalAggregator.get_kpi_summary(stateful_engine)

@router.get("/metrics/sentiment-trend")
async def get_sentiment_trend():
    """Returns 7-day Positive, Neutral, Negative trend curves."""
    return AnalyticalAggregator.get_sentiment_trend()

@router.get("/metrics/mentions-over-time")
async def get_mentions_over_time():
    """Returns 24-hour volume wave series."""
    return AnalyticalAggregator.get_mentions_over_time()

@router.get("/metrics/top-topics")
async def get_top_topics():
    """Returns top topics with volumes, progress widths, and velocity deltas."""
    return AnalyticalAggregator.get_top_topics()

@router.get("/metrics/top-entities")
async def get_top_entities():
    """Returns top entities with counts, net sentiment, and sparklines."""
    return AnalyticalAggregator.get_top_entities()

@router.get("/metrics/share-of-voice")
async def get_share_of_voice():
    """Returns competitive share of voice donut breakdown."""
    return AnalyticalAggregator.get_share_of_voice()

@router.get("/alerts")
async def get_alerts(limit: int = 10):
    """Returns active anomaly alerts."""
    db_alerts = await db_client.get_recent_alerts(limit=limit)
    if db_alerts:
        return db_alerts
    return AnalyticalAggregator.get_anomaly_alerts()

@router.get("/pipeline/health")
async def get_pipeline_health():
    """Returns streaming pipeline health telemetry for the DAG."""
    return telemetry.get_health_metrics()

@router.get("/traces")
async def get_traces(limit: int = 30):
    """Returns distributed trace spans for the Waterfall Modal."""
    traces = telemetry.get_recent_traces(limit=limit)
    if not traces:
        # Provide representative initial trace spans
        return [
            {"span_id": "spn-01", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "JetstreamIngest", "duration_ms": 12.4, "status": "OK"},
            {"span_id": "spn-02", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "KafkaProduce", "duration_ms": 5.1, "status": "OK"},
            {"span_id": "spn-03", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "StreamNormalizer", "duration_ms": 3.8, "status": "OK"},
            {"span_id": "spn-04", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "WatchlistRouter", "duration_ms": 1.2, "status": "OK"},
            {"span_id": "spn-05", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "SentimentAnalysis", "duration_ms": 18.6, "status": "OK"},
            {"span_id": "spn-06", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "EntityExtraction", "duration_ms": 14.2, "status": "OK"},
            {"span_id": "spn-07", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "StatefulWindows", "duration_ms": 6.7, "status": "OK"},
            {"span_id": "spn-08", "trace_id": "trc-live-1", "event_id": "evt-bsky-102", "component": "UI_SSE_Push", "duration_ms": 2.3, "status": "OK"}
        ]
    return traces

@router.post("/replay/start")
async def start_replay(req: ReplayRequest):
    """Triggers historical stream replay at calibrated speed multiplier (Directive 4)."""
    res = await replayer.start_scenario_replay(speed=req.speed)
    return res

@router.post("/replay/stop")
async def stop_replay():
    replayer.stop_replay()
    return {"status": "stopped"}

@router.post("/ai/query")
async def ask_ai_insight(req: AIQueryRequest):
    """Answers executive query via Local SLM synthesis."""
    answer = await narrative_agent.answer_executive_query(req.query)
    return {"query": req.query, "answer": answer}

@router.get("/stream/live-events")
async def stream_live_events():
    """
    Server-Sent Events (SSE) streaming throttled to strictly 1Hz (Directive 3).
    Emits aggregated UI snapshots to prevent client-side render thrashing.
    """
    async def event_generator():
        while True:
            # Generate 1Hz throttled snapshot
            now_iso = datetime.now(timezone.utc).isoformat()
            snapshot = {
                "timestamp": now_iso,
                "type": "ui_snapshot_1hz",
                "summary": AnalyticalAggregator.get_kpi_summary(stateful_engine),
                "trend": AnalyticalAggregator.get_sentiment_trend(stateful_engine),
                "mentions": AnalyticalAggregator.get_mentions_over_time(stateful_engine),
                "topics": AnalyticalAggregator.get_top_topics(stateful_engine),
                "entities": AnalyticalAggregator.get_top_entities(engine=stateful_engine),
                "alerts": AnalyticalAggregator.get_anomaly_alerts(stateful_engine),
                "shareOfVoice": AnalyticalAggregator.get_share_of_voice(engine=stateful_engine),
                "pipeline": telemetry.get_health_metrics()
            }
            yield f"data: {json.dumps(snapshot)}\n\n"
            await asyncio.sleep(1.0)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
