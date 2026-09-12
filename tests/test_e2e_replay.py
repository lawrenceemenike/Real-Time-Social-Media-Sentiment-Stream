import asyncio
import json
from pathlib import Path
import pytest
from src.core.pipeline import pipeline_coordinator
from src.streaming.replay import replayer
from src.ingestion.producer import KafkaEventProducer

@pytest.mark.asyncio
async def test_e2e_historical_replay_pipeline():
    producer = KafkaEventProducer.get_instance()
    
    # Start pipeline workers
    await pipeline_coordinator.start()

    sample_file = Path(__file__).resolve().parent.parent / "data" / "sample_historical_stream.json"
    with open(sample_file, "r", encoding="utf-8") as f:
        events = json.load(f)

    # Replay 10 events at 100x speed
    await replayer.replay_dataset(events[:5], speed=100.0)
    
    # Allow async queue workers to consume
    await asyncio.sleep(0.5)

    raw_events = producer.get_topic_events("social.raw")
    cleaned_events = producer.get_topic_events("social.cleaned")
    enriched_events = producer.get_topic_events("social.enriched")

    assert len(raw_events) >= 5
    assert len(cleaned_events) >= 4
    assert len(enriched_events) >= 4

    # Stop pipeline
    await pipeline_coordinator.stop()
