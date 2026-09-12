from datetime import datetime, timezone
from typing import Any, Dict, List
from src.streaming.windows import stateful_engine

class AnalyticalAggregator:
    """
    Generates structured analytical rollups dynamically derived from
    the live stateful streaming engine.
    """
    @classmethod
    def get_kpi_summary(cls, engine=None) -> Dict[str, Any]:
        eng = engine or stateful_engine
        return eng.compute_kpi_summary()

    @classmethod
    def get_sentiment_trend(cls, engine=None) -> Dict[str, Any]:
        eng = engine or stateful_engine
        return eng.compute_sentiment_trend()

    @classmethod
    def get_mentions_over_time(cls, engine=None) -> Dict[str, Any]:
        eng = engine or stateful_engine
        return eng.compute_mentions_over_time()

    @classmethod
    def get_top_topics(cls, engine=None) -> List[Dict[str, Any]]:
        eng = engine or stateful_engine
        return eng.compute_top_topics()

    @classmethod
    def get_top_entities(cls, mode: str = "telecom", engine=None) -> List[Dict[str, Any]]:
        eng = engine or stateful_engine
        return eng.compute_top_entities(mode=mode)

    @classmethod
    def get_anomaly_alerts(cls, engine=None) -> List[Dict[str, Any]]:
        eng = engine or stateful_engine
        return list(eng.active_alerts)

    @classmethod
    def get_share_of_voice(cls, mode: str = "telecom", engine=None) -> Dict[str, Any]:
        eng = engine or stateful_engine
        return eng.compute_share_of_voice(mode=mode)
