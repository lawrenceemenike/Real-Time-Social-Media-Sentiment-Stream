import re
from typing import Dict, List, Set, Tuple
from src.core.schemas import EntityMention
from src.core.config import watchlists_config

class EntityExtractor:
    """
    High-accuracy Named Entity Extractor and Alias Normalizer.
    Resolves aliases into canonical corporate/brand identities across telecommunications,
    financial institutions, and global tech providers.
    """
    CANONICAL_MAP: Dict[str, Tuple[str, str]] = {
        # Telecom NG
        "mtn": ("MTN Nigeria", "COMPETITOR"),
        "mtn ng": ("MTN Nigeria", "COMPETITOR"),
        "mtnng": ("MTN Nigeria", "COMPETITOR"),
        "mtn nigeria": ("MTN Nigeria", "COMPETITOR"),
        "yellonetwork": ("MTN Nigeria", "COMPETITOR"),
        "airtel": ("Airtel Nigeria", "COMPETITOR"),
        "airtelng": ("Airtel Nigeria", "COMPETITOR"),
        "airtel nigeria": ("Airtel Nigeria", "COMPETITOR"),
        "glo": ("Glo Nigeria", "COMPETITOR"),
        "globacom": ("Glo Nigeria", "COMPETITOR"),
        "gloworld": ("Glo Nigeria", "COMPETITOR"),
        "glo ng": ("Glo Nigeria", "COMPETITOR"),
        "glo nigeria": ("Glo Nigeria", "COMPETITOR"),
        "9mobile": ("9mobile", "COMPETITOR"),
        "etisalat": ("9mobile", "COMPETITOR"),
        "0809ja": ("9mobile", "COMPETITOR"),
        "naira": ("Naira", "CURRENCY"),
        "ngn": ("Naira", "CURRENCY"),
        "₦": ("Naira", "CURRENCY"),
        # AI Market
        "openai": ("OpenAI", "COMPETITOR"),
        "chatgpt": ("OpenAI", "PRODUCT"),
        "gpt-4": ("OpenAI", "PRODUCT"),
        "gpt-5": ("OpenAI", "PRODUCT"),
        "sora": ("OpenAI", "PRODUCT"),
        "google": ("Google", "COMPETITOR"),
        "gemini": ("Google", "PRODUCT"),
        "deepmind": ("Google", "ORG"),
        "gemma": ("Google", "PRODUCT"),
        "anthropic": ("Anthropic", "COMPETITOR"),
        "claude": ("Anthropic", "PRODUCT"),
        "meta": ("Meta", "COMPETITOR"),
        "llama": ("Meta", "PRODUCT"),
        # Banking NG
        "gtbank": ("GTBank", "COMPETITOR"),
        "gtco": ("GTBank", "COMPETITOR"),
        "access bank": ("Access Bank", "COMPETITOR"),
        "zenith bank": ("Zenith Bank", "COMPETITOR"),
        "uba": ("UBA", "COMPETITOR"),
        # Tech & Social Platforms
        "bluesky": ("Bluesky", "COMPETITOR"),
        "bsky": ("Bluesky", "COMPETITOR"),
        "atproto": ("Bluesky", "PRODUCT"),
        "apple": ("Apple", "COMPETITOR"),
        "iphone": ("Apple", "PRODUCT"),
        "macbook": ("Apple", "PRODUCT"),
        "ios": ("Apple", "PRODUCT"),
        "microsoft": ("Microsoft", "COMPETITOR"),
        "windows": ("Microsoft", "PRODUCT"),
        "linux": ("Linux", "PRODUCT"),
        "nvidia": ("Nvidia", "COMPETITOR")
    }

    _COMPILED_PATTERN = None

    @classmethod
    def _get_pattern(cls) -> re.Pattern:
        if cls._COMPILED_PATTERN is None:
            sorted_keys = sorted(cls.CANONICAL_MAP.keys(), key=lambda x: -len(x))
            escaped = [re.escape(k) for k in sorted_keys]
            pattern_str = r"(?i)\b(" + "|".join(escaped) + r")\b|₦"
            cls._COMPILED_PATTERN = re.compile(pattern_str)
        return cls._COMPILED_PATTERN

    @classmethod
    def extract_entities(cls, text: str) -> List[EntityMention]:
        if not text:
            return []

        pattern = cls._get_pattern()
        matches = pattern.finditer(text)
        
        seen_canonical: Set[str] = set()
        mentions: List[EntityMention] = []

        for m in matches:
            matched_raw = m.group(0).strip()
            key = matched_raw.lower()
            if key in cls.CANONICAL_MAP:
                canonical_name, category = cls.CANONICAL_MAP[key]
                if canonical_name not in seen_canonical:
                    seen_canonical.add(canonical_name)
                    mentions.append(EntityMention(
                        name=matched_raw,
                        category=category,
                        normalized_name=canonical_name
                    ))

        return mentions
