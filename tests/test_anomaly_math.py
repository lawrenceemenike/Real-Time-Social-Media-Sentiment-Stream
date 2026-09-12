import pytest
from src.streaming.anomaly_detector import ZScoreAnomalyDetector

def test_z_score_calculation_triggers_high_severity():
    detector = ZScoreAnomalyDetector(threshold=2.5)
    # Baseline: mean=140, std=28. Current = 390 -> Z = (390-140)/28 = 8.92857 -> 8.93
    alert = detector.evaluate(
        entity="MTN Nigeria",
        current_val=390,
        baseline_mean=140,
        baseline_std=28,
        watchlist="telecom_ng",
        associated_topics=["data pricing"],
        sample_text="MTN data is way too expensive now"
    )
    assert alert is not None
    assert alert.severity == "HIGH"
    assert alert.z_score == 8.93

def test_z_score_triggers_medium_severity():
    detector = ZScoreAnomalyDetector(threshold=2.5)
    # Baseline: mean=100, std=20. Current = 155 -> Z = (155-100)/20 = 2.75
    alert = detector.evaluate(
        entity="Airtel Nigeria",
        current_val=155,
        baseline_mean=100,
        baseline_std=20,
        watchlist="telecom_ng",
        associated_topics=["network speed"],
        sample_text="Positive comments surging"
    )
    assert alert is not None
    assert alert.severity == "MEDIUM"
    assert alert.z_score == 2.75

def test_z_score_ignores_nominal_fluctuations():
    detector = ZScoreAnomalyDetector(threshold=2.5)
    # Current = 150 -> Z = (150-140)/28 = 0.36
    alert = detector.evaluate(
        entity="MTN Nigeria",
        current_val=150,
        baseline_mean=140,
        baseline_std=28,
        watchlist="telecom_ng",
        associated_topics=["general"],
        sample_text="Nominal activity"
    )
    assert alert is None
