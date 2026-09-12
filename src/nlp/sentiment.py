import math
import re
from typing import Dict, Optional, Tuple
from src.core.schemas import SentimentScore

class SentimentAnalyzer:
    """
    Multi-task Sentiment Analyzer.
    Provides sub-millisecond deterministic scoring with transformer-compatible
    labels ('positive', 'neutral', 'negative'), score in [-1.0, 1.0], and confidence in [0.0, 1.0].
    """
    POSITIVE_WORDS = {
        "good", "great", "excellent", "fast", "reliable", "superb", "love", "best", "smooth",
        "awesome", "cheaper", "affordable", "amazing", "prefer", "stable", "satisfied", "thank",
        "thanks", "appreciate", "impressed", "wonderful", "solid", "kudos", "perfect", "better"
    }

    NEGATIVE_WORDS = {
        "bad", "terrible", "worst", "slow", "poor", "hate", "trash", "scam", "useless", "down",
        "outage", "robbery", "stolen", "unusable", "unreliable", "expensive", "drain", "draining",
        "crazy", "frustrated", "frustrating", "annoying", "disgusting", "horrible", "failed",
        "failing", "awful", "ridiculous", "overpriced", "pathetic", "thieves", "loss", "broken"
    }

    INTENSIFIERS = {"very", "extremely", "really", "so", "way", "absolutely", "super", "totally"}
    NEGATORS = {"not", "never", "no", "hardly", "barely", "scarcely", "isn't", "aren't", "wasn't"}

    @classmethod
    def analyze(cls, text: str) -> SentimentScore:
        if not text:
            return SentimentScore(label="neutral", score=0.0, confidence=0.5)

        tokens = re.findall(r"\b\w+(?:'\w+)?\b", text.lower())
        if not tokens:
            return SentimentScore(label="neutral", score=0.0, confidence=0.5)

        pos_score = 0.0
        neg_score = 0.0
        negated = False

        for i, token in enumerate(tokens):
            if token in cls.NEGATORS:
                negated = True
                continue

            multiplier = 1.5 if (i > 0 and tokens[i - 1] in cls.INTENSIFIERS) else 1.0

            if token in cls.POSITIVE_WORDS:
                if negated:
                    neg_score += 1.0 * multiplier
                else:
                    pos_score += 1.0 * multiplier
                negated = False
            elif token in cls.NEGATIVE_WORDS:
                if negated:
                    pos_score += 0.8 * multiplier
                else:
                    neg_score += 1.2 * multiplier
                negated = False

        total = pos_score + neg_score
        if total == 0:
            return SentimentScore(label="neutral", score=0.0, confidence=0.7)

        raw_score = (pos_score - neg_score) / total
        # Normalize to [-1.0, 1.0] with tanh dampening
        final_score = round(math.tanh(raw_score * 1.5), 3)

        confidence = round(min(0.6 + 0.1 * total, 0.98), 2)

        if final_score > 0.15:
            label = "positive"
        elif final_score < -0.15:
            label = "negative"
        else:
            label = "neutral"

        return SentimentScore(
            label=label,
            score=final_score,
            confidence=confidence
        )
