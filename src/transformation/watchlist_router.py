import re
from typing import Any, Dict, List, Set, Tuple
from src.core.config import watchlists_config

class WatchlistRouter:
    """
    High-speed Pre-Enrichment Watchlist Router (Directive 2).
    Pre-filters incoming social events against configured watchlists (entities, aliases, topics)
    so that only relevant commercial conversations trigger heavy spaCy & RoBERTa NLP inference.
    """
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or watchlists_config
        self._compiled_patterns: Dict[str, re.Pattern] = {}
        self._entity_lookup: Dict[str, Dict[str, str]] = {}
        self._build_indexes()

    def _build_indexes(self):
        for wl_key, wl_data in self.config.items():
            terms: Set[str] = set()
            self._entity_lookup[wl_key] = {}

            # Add entities and their aliases
            for entity in wl_data.get("entities", []):
                canonical = entity.get("name", "")
                aliases = entity.get("aliases", [])
                for alias in aliases + [canonical]:
                    if alias:
                        escaped = re.escape(alias.lower())
                        terms.add(rf"\b{escaped}\b" if len(alias) > 2 else rf"\b{escaped}\b")
                        self._entity_lookup[wl_key][alias.lower()] = canonical

            # Add topics
            for topic in wl_data.get("topics", []):
                if topic:
                    escaped = re.escape(topic.lower())
                    terms.add(rf"\b{escaped}\b")

            if terms:
                combined_pattern = "|".join(terms)
                self._compiled_patterns[wl_key] = re.compile(combined_pattern, re.IGNORECASE)

    def route_event(self, text: str) -> Tuple[bool, List[str], List[str]]:
        """
        Evaluates text against watchlists.
        Returns:
            (is_matched, matching_watchlists, matched_keywords)
        """
        if not text:
            return False, [], []

        text_lower = text.lower()
        matched_watchlists = []
        matched_keywords = []

        for wl_key, pattern in self._compiled_patterns.items():
            matches = pattern.findall(text_lower)
            if matches:
                matched_watchlists.append(wl_key)
                matched_keywords.extend(matches)

        is_matched = len(matched_watchlists) > 0
        return is_matched, matched_watchlists, list(set(matched_keywords))

    def resolve_canonical_entity(self, watchlist: str, term: str) -> str:
        lookup = self._entity_lookup.get(watchlist, {})
        return lookup.get(term.lower(), term)

watchlist_router = WatchlistRouter()
