from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from src.core.schemas import (
    RawSocialEvent,
    CleanedSocialEvent,
    SentimentScore,
    EntityMention,
    CommercialIntent,
    EnrichedSocialEvent,
    AnomalyAlertEvent
)

def test_raw_social_event_valid():
    event = RawSocialEvent(
        source="bluesky",
        source_event_id="3k123abc",
        author_id="did:plc:test12345",
        timestamp=datetime.now(timezone.utc),
        text="MTN 5G is super fast today!"
    )
    assert event.event_id.startswith("evt-")
    assert event.source == "bluesky"
    assert "MTN" in event.text
    # Backwards compatibility check
    assert isinstance(event.dict(), dict)

def test_sentiment_score_boundary_validation():
    valid_score = SentimentScore(label="positive", score=0.85, confidence=0.92)
    assert valid_score.score == 0.85

    with pytest.raises(ValidationError):
        SentimentScore(label="positive", score=1.5, confidence=0.92)  # score > 1.0

    with pytest.raises(ValidationError):
        SentimentScore(label="negative", score=-0.5, confidence=-0.1)  # confidence < 0.0

def test_commercial_intent_switching():
    intent = CommercialIntent(
        category="switching_intent",
        confidence=0.88,
        target_competitor="Airtel"
    )
    assert intent.category == "switching_intent"
    assert intent.target_competitor == "Airtel"

def test_anomaly_alert_event_structure():
    alert = AnomalyAlertEvent(
        watchlist="telecom_ng",
        entity="MTN Nigeria",
        metric="negative_mentions_velocity",
        severity="HIGH",
        baseline_mean=140.0,
        current_value=390.0,
        z_score=8.93,
        associated_topics=["data pricing", "tariff"],
        sample_text="MTN data is way too expensive"
    )
    assert alert.alert_id.startswith("alt-")
    assert alert.severity == "HIGH"
    assert alert.z_score == 8.93
