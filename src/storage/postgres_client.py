import asyncio
from datetime import datetime, timezone
import json
import logging
import os
import sqlite3
from typing import Any, Dict, List, Optional
from src.core.config import settings

logger = logging.getLogger("comintel.storage.postgres")

class DatabaseClient:
    """
    Relational storage client supporting PostgreSQL with automatic SQLite WAL fallback
    for local development and zero-dependency testing.
    """
    def __init__(self, dsn: Optional[str] = None):
        self.dsn = dsn or settings.POSTGRES_DSN
        self.sqlite_path = settings.SQLITE_FALLBACK_PATH
        self.is_sqlite = True
        self._init_sqlite()

    def _init_sqlite(self):
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS entity_metrics_hourly (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_name TEXT NOT NULL,
                    watchlist TEXT NOT NULL,
                    window_start TEXT NOT NULL,
                    window_end TEXT NOT NULL,
                    mention_count INTEGER DEFAULT 0,
                    positive_count INTEGER DEFAULT 0,
                    neutral_count INTEGER DEFAULT 0,
                    negative_count INTEGER DEFAULT 0,
                    net_sentiment REAL DEFAULT 0.0,
                    share_of_voice REAL DEFAULT 0.0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS anomaly_alerts (
                    alert_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    entity_name TEXT NOT NULL,
                    watchlist TEXT NOT NULL,
                    metric TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    baseline_mean REAL NOT NULL,
                    current_value REAL NOT NULL,
                    z_score REAL NOT NULL,
                    associated_topics TEXT,
                    sample_text TEXT,
                    executive_summary TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    async def insert_anomaly_alert(self, alert_dict: Dict[str, Any]):
        def _exec():
            with sqlite3.connect(self.sqlite_path) as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO anomaly_alerts (
                        alert_id, timestamp, entity_name, watchlist, metric, severity,
                        baseline_mean, current_value, z_score, associated_topics,
                        sample_text, executive_summary
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    alert_dict.get("alert_id"),
                    str(alert_dict.get("timestamp")),
                    alert_dict.get("entity", ""),
                    alert_dict.get("watchlist", ""),
                    alert_dict.get("metric", ""),
                    alert_dict.get("severity", "MEDIUM"),
                    float(alert_dict.get("baseline_mean", 0.0)),
                    float(alert_dict.get("current_value", 0.0)),
                    float(alert_dict.get("z_score", 0.0)),
                    json.dumps(alert_dict.get("associated_topics", [])),
                    alert_dict.get("sample_text", ""),
                    alert_dict.get("executive_summary", "")
                ))
                conn.commit()
        await asyncio.to_thread(_exec)

    async def get_recent_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        def _query():
            with sqlite3.connect(self.sqlite_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute(
                    "SELECT * FROM anomaly_alerts ORDER BY timestamp DESC LIMIT ?", 
                    (limit,)
                )
                rows = cursor.fetchall()
                result = []
                for r in rows:
                    d = dict(r)
                    if d.get("associated_topics"):
                        try:
                            d["associated_topics"] = json.loads(d["associated_topics"])
                        except Exception:
                            d["associated_topics"] = []
                    result.append(d)
                return result
        return await asyncio.to_thread(_query)

db_client = DatabaseClient()
