from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

def current_utc_time() -> datetime:
    return datetime.now(timezone.utc)

class BaseSchema(BaseModel):
    def dict(self, *args, **kwargs) -> Dict[str, Any]:
        """Pydantic v2 backwards compatibility for v1 .dict() calls."""
        return self.model_dump(*args, **kwargs)

class RawSocialEvent(BaseSchema):
    event_id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:12]}")
    source: Literal["bluesky", "mastodon", "replay", "simulated"]
    source_event_id: str
    author_id: str
    timestamp: datetime
    text: str
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    ingested_at: datetime = Field(default_factory=current_utc_time)

class CleanedSocialEvent(BaseSchema):
    event_id: str
    source: str
    source_event_id: str
    author_id: str
    timestamp: datetime
    text: str
    cleaned_text: str
    language: str
    urls: List[str] = Field(default_factory=list)
    is_duplicate: bool = False
    ingested_at: datetime

class SentimentScore(BaseSchema):
    label: Literal["positive", "neutral", "negative"]
    score: float = Field(..., ge=-1.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)

class EntityMention(BaseSchema):
    name: str
    category: Literal["ORG", "PRODUCT", "PERSON", "LOC", "COMPETITOR", "CURRENCY"]
    normalized_name: str

class CommercialIntent(BaseSchema):
    category: Literal[
        "complaint",
        "purchase_intent",
        "switching_intent",
        "pricing_discussion",
        "service_outage",
        "brand_praise",
        "neutral"
    ]
    confidence: float = Field(..., ge=0.0, le=1.0)
    target_competitor: Optional[str] = None

class EnrichedSocialEvent(BaseSchema):
    event_id: str
    timestamp: datetime
    source: str
    text: str
    cleaned_text: str
    sentiment: SentimentScore
    entities: List[EntityMention]
    topics: List[str]
    intent: CommercialIntent
    watchlist_tags: List[str] = Field(default_factory=list)
    engagement: Dict[str, int] = Field(default_factory=lambda: {"likes": 0, "reposts": 0, "replies": 0})
    trace_id: str = Field(default_factory=lambda: f"trc-{uuid.uuid4().hex[:16]}")
    processed_at: datetime = Field(default_factory=current_utc_time)

class AnomalyAlertEvent(BaseSchema):
    alert_id: str = Field(default_factory=lambda: f"alt-{uuid.uuid4().hex[:8]}")
    timestamp: datetime = Field(default_factory=current_utc_time)
    watchlist: str
    entity: str
    metric: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    baseline_mean: float
    current_value: float
    z_score: float
    associated_topics: List[str] = Field(default_factory=list)
    sample_text: str
    executive_summary: Optional[str] = None

class TraceSpan(BaseSchema):
    span_id: str = Field(default_factory=lambda: f"spn-{uuid.uuid4().hex[:10]}")
    trace_id: str
    event_id: str
    component: str
    start_time: datetime = Field(default_factory=current_utc_time)
    duration_ms: float
    status: Literal["OK", "ERROR"] = "OK"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class DeadLetterEvent(BaseSchema):
    dlq_id: str = Field(default_factory=lambda: f"dlq-{uuid.uuid4().hex[:8]}")
    raw_payload: Dict[str, Any]
    error_reason: str
    failed_at_component: str
    timestamp: datetime = Field(default_factory=current_utc_time)

class DashboardMetricsSummary(BaseSchema):
    total_mentions: int
    total_mentions_change_pct: float
    overall_sentiment_pct: float
    overall_sentiment_change_pct: float
    negative_mentions: int
    negative_mentions_change_pct: float
    engagement: float
    engagement_change_pct: float
    mention_velocity_per_min: float
    sentiment_distribution: Dict[str, float]
    updated_at: datetime = Field(default_factory=current_utc_time)
