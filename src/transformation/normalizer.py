import html
import re
from typing import Optional, Tuple
from langdetect import detect
from src.core.schemas import RawSocialEvent, CleanedSocialEvent
from src.transformation.watchlist_router import watchlist_router

class StreamNormalizer:
    URL_REGEX = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
    HTML_TAG_REGEX = re.compile(r"<[^>]+>")
    WHITESPACE_REGEX = re.compile(r"\s+")

    @classmethod
    def clean_text(cls, text: str) -> str:
        if not text:
            return ""
        # 1. Unescape HTML entities
        text = html.unescape(text)
        # 2. Strip HTML tags
        text = cls.HTML_TAG_REGEX.sub(" ", text)
        # 3. Strip URLs
        text = cls.URL_REGEX.sub("", text)
        # 4. Collapse whitespace
        text = cls.WHITESPACE_REGEX.sub(" ", text).strip()
        return text

    @classmethod
    def detect_language(cls, text: str) -> str:
        if not text or len(text) < 3:
            return "unknown"
        # Fast-path: Common English stopwords check (microsecond latency)
        common_en = {"the", "is", "in", "to", "and", "a", "for", "with", "my", "your", "on", "data", "phone", "network", "of", "it", "i", "you", "that", "this", "be", "are", "at", "not", "have", "as"}
        words = set(text.lower().split())
        if len(words.intersection(common_en)) >= 1:
            return "en"
        try:
            return detect(text)
        except Exception:
            return "unknown"

    @classmethod
    def process_raw(
        cls, 
        raw: RawSocialEvent, 
        require_watchlist_match: bool = False
    ) -> Tuple[Optional[CleanedSocialEvent], Optional[str]]:
        """
        Validates, normalizes, and routes raw social events.
        Returns:
            (CleanedSocialEvent or None, failure_reason or None)
        """
        if not raw.text or len(raw.text.strip()) < 3:
            return None, "Text is empty or shorter than 3 characters"

        cleaned = cls.clean_text(raw.text)
        if len(cleaned) < 3:
            return None, "Text empty after URL and tag sanitation"

        # Pre-Enrichment Watchlist Router Gate (Directive 2)
        is_matched, matched_wls, matched_kw = watchlist_router.route_event(cleaned)
        if require_watchlist_match and not is_matched:
            return None, "Event does not match any monitored watchlist entity or topic"

        lang = cls.detect_language(cleaned)
        urls = cls.URL_REGEX.findall(raw.text)

        cleaned_event = CleanedSocialEvent(
            event_id=raw.event_id,
            source=raw.source,
            source_event_id=raw.source_event_id,
            author_id=raw.author_id,
            timestamp=raw.timestamp,
            text=raw.text,
            cleaned_text=cleaned,
            language=lang,
            urls=urls,
            is_duplicate=False,
            ingested_at=raw.ingested_at
        )
        return cleaned_event, None
