import asyncio
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from src.core.schemas import RawSocialEvent
from src.ingestion.producer import KafkaEventProducer

logger = logging.getLogger("comintel.streaming.replay")

class HistoricalStreamReplayer:
    """
    Deterministic Historical Stream Replayer (Epic 10 & Directive 4).
    Replays historical incident datasets into 'social.raw' at calibrated speeds (1x, 5x, 10x)
    for reproducible incident validation, anomaly testing, and live UI demonstrations.
    """
    def __init__(self, producer: Optional[KafkaEventProducer] = None, speed_multiplier: float = 10.0):
        self.producer = producer or KafkaEventProducer.get_instance()
        self.speed = max(0.1, speed_multiplier)
        self.is_replaying = False
        self._replay_task: Optional[asyncio.Task] = None

    async def replay_dataset(self, events: List[Dict[str, Any]], speed: Optional[float] = None, loop: bool = False):
        """Replays a list of event dictionaries at the calibrated speed."""
        if speed:
            self.speed = max(0.1, speed)

        self.is_replaying = True
        logger.info("Starting historical replay of %d events at %.1fx speed (loop=%s)", len(events), self.speed, loop)

        iteration = 0
        while self.is_replaying:
            iteration += 1
            for record in events:
                if not self.is_replaying:
                    break

                curr_time = datetime.now(timezone.utc)
                raw_event = RawSocialEvent(
                    source="replay",
                    source_event_id=f"rep-{iteration}-{int(curr_time.timestamp() * 1000)}",
                    author_id=str(record.get("author_id", f"analyst_{iteration}")),
                    timestamp=curr_time,
                    text=str(record.get("text", "")),
                    raw_payload=record
                )

                await self.producer.send("social.raw", key=raw_event.author_id, value=raw_event.dict())
                # Delay between events based on speed multiplier (e.g., 0.1s at 10x)
                await asyncio.sleep(max(0.005, 1.0 / self.speed))

            if not loop:
                break

        self.is_replaying = False
        logger.info("Historical replay stopped.")

    async def start_scenario_replay(self, speed: float = 10.0):
        """Launches the default Nigerian Telecom Pricing Outage scenario dataset in continuous loop."""
        sample_path = Path(__file__).resolve().parent.parent.parent / "data" / "sample_historical_stream.json"
        if not sample_path.exists():
            return {"status": "error", "message": "Scenario data file not found"}

        with open(sample_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if self._replay_task and not self._replay_task.done():
            self._replay_task.cancel()

        self._replay_task = asyncio.create_task(self.replay_dataset(data, speed=speed, loop=True))
        return {"status": "started", "speed": speed, "events_count": len(data)}

    def stop_replay(self):
        self.is_replaying = False
        if self._replay_task and not self._replay_task.done():
            self._replay_task.cancel()

replayer = HistoricalStreamReplayer()
