from datetime import datetime, timezone
import math
from typing import List, Optional
from src.core.schemas import AnomalyAlertEvent

class ZScoreAnomalyDetector:
    """
    Evaluates volumetric and sentiment anomalies against historical baselines:
    Z = (Current - Mean) / StdDev
    """
    def __init__(self, threshold: float = 2.5):
        self.threshold = threshold

    def evaluate(
        self,
        entity: str,
        current_val: float,
        baseline_mean: float,
        baseline_std: float,
        watchlist: str = "telecom_ng",
        associated_topics: Optional[List[str]] = None,
        sample_text: str = "",
        metric: str = "negative_mentions_velocity"
    ) -> Optional[AnomalyAlertEvent]:
        if baseline_std <= 0:
            return None

        z_score = (current_val - baseline_mean) / baseline_std
        if z_score >= self.threshold:
            severity = "HIGH" if z_score >= 3.5 else "MEDIUM"
            return AnomalyAlertEvent(
                timestamp=datetime.now(timezone.utc),
                watchlist=watchlist,
                entity=entity,
                metric=metric,
                severity=severity,
                baseline_mean=float(baseline_mean),
                current_value=float(current_val),
                z_score=round(z_score, 2),
                associated_topics=associated_topics or [],
                sample_text=sample_text,
                executive_summary=None
            )
        return None
