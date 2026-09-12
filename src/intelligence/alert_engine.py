import logging
from typing import Any, Dict, List
from src.core.schemas import AnomalyAlertEvent
from src.intelligence.narrative_agent import narrative_agent
from src.storage.postgres_client import db_client
from src.storage.redis_cache import redis_store

logger = logging.getLogger("comintel.intelligence.alerts")

class AlertEngine:
    """
    Manages alert lifecycle, enriches statistical anomalies with SLM briefings,
    persists records, and publishes alerts to real-time UI transport channels.
    """
    def __init__(self):
        self.recent_alerts: List[Dict[str, Any]] = []

    async def process_anomaly(self, alert: AnomalyAlertEvent) -> Dict[str, Any]:
        # Generate executive summary via Local SLM
        summary = await narrative_agent.synthesize_anomaly(alert)
        alert.executive_summary = summary

        alert_dict = alert.dict()
        self.recent_alerts.insert(0, alert_dict)
        if len(self.recent_alerts) > 50:
            self.recent_alerts.pop()

        # Persist to database
        await db_client.insert_anomaly_alert(alert_dict)

        # Broadcast via Redis pub/sub
        await redis_store.publish_event("intelligence.anomalies", {
            "type": "anomaly_alert",
            "payload": alert_dict
        })

        return alert_dict

alert_engine = AlertEngine()
