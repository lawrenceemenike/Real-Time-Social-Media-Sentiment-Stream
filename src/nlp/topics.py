import re
from typing import List

class TopicClassifier:
    """
    Maps conversations to high-level market topics:
    Data Price, Network Issue, Customer Service, Airtel vs MTN, Recharge Plans.
    """
    TOPIC_RULES = [
        ("Data Price", [r"(?i)\b(?:data price|data prices|expensive data|cheap data|data tariff|cost of data|megabyte|gigabyte|gb)\b"]),
        ("Network Issue", [r"(?i)\b(?:network issue|network problems|slow internet|no service|signal bad|poor network|bad reception)\b"]),
        ("Customer Service", [r"(?i)\b(?:customer care|customer service|call center|representative|support|agent|help desk)\b"]),
        ("Airtel vs MTN", [r"(?i)(?:airtel|mtn).+(?:versus|vs|better than|compared to).+(?:mtn|airtel)"]),
        ("Recharge Plans", [r"(?i)\b(?:recharge|airtime|top up|bonus|bundle plan|tariff plan|data plan)\b"]),
        ("Service Outage", [r"(?i)\b(?:outage|network down|service down|blackout|down again)\b"]),
        ("5G Coverage", [r"(?i)\b(?:5g|5g network|5g speed|5g coverage|broadband)\b"])
    ]

    @classmethod
    def classify_topics(cls, text: str) -> List[str]:
        if not text:
            return []

        matched_topics = []
        for topic_name, patterns in cls.TOPIC_RULES:
            for p in patterns:
                if re.search(p, text):
                    matched_topics.append(topic_name)
                    break

        if not matched_topics:
            # Fallback if specific entities are present but general conversation
            if any(term in text.lower() for term in ["plan", "sim", "phone", "bill"]):
                matched_topics.append("Recharge Plans")

        return matched_topics
