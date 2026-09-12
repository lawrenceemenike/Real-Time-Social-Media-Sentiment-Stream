from datetime import datetime, timezone
import pytest
from src.core.schemas import RawSocialEvent
from src.ingestion.bluesky_jetstream import BlueskyJetstreamConsumer
from src.transformation.normalizer import StreamNormalizer
from src.transformation.deduplicator import EventDeduplicator

def test_parse_bluesky_jetstream_commit():
    raw_message = {
        "did": "did:plc:rag257fky4oaluzmvyox57f4",
        "time_us": 1715882410123456,
        "kind": "commit",
        "commit": {
            "rev": "3ks2h8p76m225",
            "operation": "create",
            "collection": "app.bsky.feed.post",
            "rkey": "3ks2h8p74w225",
            "record": {
                "$type": "app.bsky.feed.post",
                "createdAt": "2026-05-16T18:00:10.123Z",
                "text": "MTN network is slow in Abuja right now https://speedtest.net"
            },
            "cid": "bafyreih3..."
        }
    }
    event = BlueskyJetstreamConsumer.parse_message(raw_message)
    assert event is not None
    assert event.source == "bluesky"
    assert event.author_id == "did:plc:rag257fky4oaluzmvyox57f4"
    assert "MTN network is slow" in event.text
    assert event.source_event_id == "3ks2h8p74w225"

def test_stream_normalizer_cleans_urls_and_detects_language():
    raw = RawSocialEvent(
        source="bluesky",
        source_event_id="test-1",
        author_id="user-1",
        timestamp=datetime.now(timezone.utc),
        text="Check this out https://example.com/test MTN network data is expensive! <br/>"
    )
    cleaned, err = StreamNormalizer.process_raw(raw)
    assert err is None
    assert cleaned is not None
    assert "https://" not in cleaned.cleaned_text
    assert "<br/>" not in cleaned.cleaned_text
    assert len(cleaned.urls) == 1
    assert cleaned.language in ("en", "unknown")

def test_deduplicator_catches_duplicate_posts():
    dedup = EventDeduplicator(window_seconds=60)
    author = "user-bot-99"
    text = "Buy cheap data bundles at our site now"

    assert dedup.is_duplicate(author, text) is False
    assert dedup.is_duplicate(author, text) is True  # Duplicate within window
    assert dedup.is_duplicate("other-author", text) is False  # Different author
