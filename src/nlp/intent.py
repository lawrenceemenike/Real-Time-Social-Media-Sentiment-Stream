import re
from typing import List, Optional
from src.core.schemas import CommercialIntent

class CommercialIntentClassifier:
    """
    Classifies social media conversations into commercial and operational intents:
    switching_intent, complaint, pricing_discussion, service_outage, brand_praise, neutral.
    """
    SWITCHING_PATTERNS = [
        r"(?i)(?:switching|moving|ported|porting|migrating)\s+(?:from\s+[A-Za-z0-9_]+\s+)?to\s+([A-Za-z0-9_]+)",
        r"(?i)(?:dumping|leaving|cancelling|abandoning)\s+([A-Za-z0-9_]+)\s+for\s+([A-Za-z0-9_]+)",
        r"(?i)(?:better\s+than|prefer)\s+([A-Za-z0-9_]+)",
        r"(?i)(?:goodbye|done with)\s+([A-Za-z0-9_]+)",
        r"(?i)(?:buying|getting)\s+(?:an?\s+)?([A-Za-z0-9_]+)\s+sim"
    ]

    COMPLAINT_PATTERNS = [
        r"(?i)(scam|terrible|worst|useless|unusable|slow|stolen|robbery|down|outage|network issue)",
        r"(?i)(data\s+draining|poor\s+service|fix\s+your)"
    ]

    PRICING_PATTERNS = [
        r"(?i)\b(?:price|prices|cost|costs|tariff|tariffs|expensive|recharge|rate|rates|billing|bundle|bundles|subscription)\b"
    ]

    PRAISE_PATTERNS = [
        r"(?i)\b(?:love|kudos|amazing service|best network|great speed|impressed|unmatched|solid service|proud of)\b"
    ]

    @classmethod
    def classify(cls, text: str, matched_entities: Optional[List[str]] = None) -> CommercialIntent:
        if not text:
            return CommercialIntent(category="neutral", confidence=0.50)

        # 1. Check Switching Intent
        for p in cls.SWITCHING_PATTERNS:
            match = re.search(p, text)
            if match:
                groups = match.groups()
                target = groups[-1] if groups else None
                if target:
                    target = target.strip().capitalize()
                return CommercialIntent(
                    category="switching_intent",
                    confidence=0.88,
                    target_competitor=target
                )

        # 2. Check Complaint (includes outage, scam, terrible service)
        for p in cls.COMPLAINT_PATTERNS:
            if re.search(p, text):
                return CommercialIntent(category="complaint", confidence=0.85)

        # 3. Check Pricing Discussion
        for p in cls.PRICING_PATTERNS:
            if re.search(p, text):
                return CommercialIntent(category="pricing_discussion", confidence=0.80)

        # 4. Check Brand Praise
        for p in cls.PRAISE_PATTERNS:
            if re.search(p, text):
                return CommercialIntent(category="brand_praise", confidence=0.82)

        return CommercialIntent(category="neutral", confidence=0.50)
