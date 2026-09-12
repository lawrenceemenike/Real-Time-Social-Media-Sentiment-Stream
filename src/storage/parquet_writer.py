from datetime import datetime, timezone
import os
from pathlib import Path
from typing import Any, Dict, List
import pyarrow as pa
import pyarrow.parquet as pq
from src.core.config import settings

class ParquetPartitionWriter:
    """
    Persists historical enriched analytical events into date-partitioned Parquet files
    for long-term storage, cold audit trails, and stream replay.
    """
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.PARQUET_BASE_DIR)

    def write_batch(self, events: List[Dict[str, Any]]) -> str:
        if not events:
            return ""

        now = datetime.now(timezone.utc)
        partition_dir = self.base_dir / f"year={now.year}" / f"month={now.month:02d}" / f"day={now.day:02d}"
        partition_dir.mkdir(parents=True, exist_ok=True)

        file_path = partition_dir / f"events_{int(now.timestamp())}.parquet"

        # Prepare records with serialized sub-structures
        records = []
        for e in events:
            rec = {
                "event_id": str(e.get("event_id", "")),
                "timestamp": str(e.get("timestamp", "")),
                "source": str(e.get("source", "")),
                "text": str(e.get("text", "")),
                "cleaned_text": str(e.get("cleaned_text", "")),
                "sentiment_label": str(e.get("sentiment", {}).get("label", "neutral") if isinstance(e.get("sentiment"), dict) else "neutral"),
                "sentiment_score": float(e.get("sentiment", {}).get("score", 0.0) if isinstance(e.get("sentiment"), dict) else 0.0),
                "intent_category": str(e.get("intent", {}).get("category", "neutral") if isinstance(e.get("intent"), dict) else "neutral")
            }
            records.append(rec)

        table = pa.Table.from_pylist(records)
        pq.write_table(table, file_path, compression="snappy")
        return str(file_path)

parquet_writer = ParquetPartitionWriter()
