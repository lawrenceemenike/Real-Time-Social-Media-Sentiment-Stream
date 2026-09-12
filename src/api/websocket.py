import asyncio
from datetime import datetime, timezone
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.streaming.aggregations import AnalyticalAggregator
from src.streaming.windows import stateful_engine
from src.core.telemetry import telemetry

logger = logging.getLogger("comintel.api.websocket")
ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@ws_router.websocket("/api/v1/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    """
    Bidirectional WebSocket connection throttled at 1Hz (Directive 3).
    Transmits live UI metrics, velocities, and pipeline health snapshots.
    """
    await manager.connect(websocket)
    try:
        while True:
            snapshot = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "metric_update_1hz",
                "summary": AnalyticalAggregator.get_kpi_summary(stateful_engine),
                "trend": AnalyticalAggregator.get_sentiment_trend(stateful_engine),
                "mentions": AnalyticalAggregator.get_mentions_over_time(stateful_engine),
                "topics": AnalyticalAggregator.get_top_topics(stateful_engine),
                "entities": AnalyticalAggregator.get_top_entities(engine=stateful_engine),
                "alerts": AnalyticalAggregator.get_anomaly_alerts(stateful_engine),
                "shareOfVoice": AnalyticalAggregator.get_share_of_voice(engine=stateful_engine),
                "pipeline": telemetry.get_health_metrics()
            }
            await websocket.send_text(json.dumps(snapshot))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except asyncio.CancelledError:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug("WebSocket error: %s", e)
        manager.disconnect(websocket)
