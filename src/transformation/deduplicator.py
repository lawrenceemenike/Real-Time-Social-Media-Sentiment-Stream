import hashlib
import time
from typing import Dict

class EventDeduplicator:
    """
    Sliding-window deduplicator using SHA-256 content hashes with TTL.
    Prevents duplicate firehose posts and automated bot spam from entering downstream NLP.
    """
    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        self._seen_hashes: Dict[str, float] = {}

    def _hash_event(self, author_id: str, text: str) -> str:
        content = f"{author_id}:{text.strip().lower()}"
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    def is_duplicate(self, author_id: str, text: str) -> bool:
        now = time.time()
        self._cleanup(now)
        
        event_hash = self._hash_event(author_id, text)
        if event_hash in self._seen_hashes:
            return True
            
        self._seen_hashes[event_hash] = now
        return False

    def _cleanup(self, now: float):
        if len(self._seen_hashes) > 10000:
            threshold = now - self.window_seconds
            self._seen_hashes = {h: t for h, t in self._seen_hashes.items() if t > threshold}

    def reset(self):
        self._seen_hashes.clear()
