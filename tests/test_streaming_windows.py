from datetime import datetime, timezone
import pytest
from src.core.schemas import EnrichedSocialEvent, SentimentScore, EntityMention, CommercialIntent
from src.streaming.windows import StatefulStreamingEngine

@pytest.mark.asyncio
async def test_stateful_engine_sliding_window_metrics():
    engine = StatefulStreamingEngine()
    
    # Ingest 3 events (2 negative, 1 positive)
    for i in range(2):
        event = EnrichedSocialEvent(
            event_id=f"evt-test-{i}",
            timestamp=datetime.now(timezone.utc),
            source="bluesky",
            text="MTN data is bad and slow",
            cleaned_text="MTN data is bad and slow",
            sentiment=SentimentScore(label="negative", score=-0.65, confidence=0.85),
            entities=[EntityMention(name="MTN", category="COMPETITOR", normalized_name="MTN Nigeria")],
            topics=["Data Price"],
            intent=CommercialIntent(category="complaint", confidence=0.8)
        )
        await engine.ingest_enriched_event(event)

    pos_event = EnrichedSocialEvent(
        event_id="evt-test-pos",
        timestamp=datetime.now(timezone.utc),
        source="bluesky",
        text="Airtel is great and fast",
        cleaned_text="Airtel is great and fast",
        sentiment=SentimentScore(label="positive", score=0.75, confidence=0.90),
        entities=[EntityMention(name="Airtel", category="COMPETITOR", normalized_name="Airtel Nigeria")],
        topics=["Network Issue"],
        intent=CommercialIntent(category="brand_praise", confidence=0.85)
    )
    await engine.ingest_enriched_event(pos_event)

    metrics = engine.compute_window_metrics(window_seconds=3600)
    assert metrics["total_mentions"] == 3
    assert metrics["negative_count"] == 2
    assert metrics["positive_count"] == 1
    assert metrics["mention_velocity_per_min"] > 0

    sov = engine.compute_share_of_voice()
    assert "MTN Nigeria" in sov
    assert "Airtel Nigeria" in sov
