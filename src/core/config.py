from pathlib import Path
from typing import Any, Dict, List, Optional
import os
import yaml
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"

class Settings(BaseModel):
    # Kafka & Broker settings
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    KAFKA_ENABLED: bool = os.getenv("KAFKA_ENABLED", "false").lower() in ("1", "true", "yes")
    
    # Ingestion settings
    JETSTREAM_URL: str = os.getenv(
        "JETSTREAM_URL", 
        "wss://jetstream1.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post"
    )
    MASTODON_INSTANCE: str = os.getenv("MASTODON_INSTANCE", "https://mastodon.social")
    
    # Storage settings
    POSTGRES_DSN: str = os.getenv(
        "POSTGRES_DSN", 
        "postgresql://comintel_user:comintel_password@localhost:5432/comintel"
    )
    SQLITE_FALLBACK_PATH: str = str(PROJECT_ROOT / "data" / "comintel_local.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    PARQUET_BASE_DIR: str = str(PROJECT_ROOT / "data" / "lake")
    
    # Intelligence / Local SLM
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma:2b")
    
    # Streaming & Anomaly Detection
    ANOMALY_Z_THRESHOLD: float = float(os.getenv("ANOMALY_Z_THRESHOLD", "2.5"))
    STREAM_WINDOW_SECONDS: int = int(os.getenv("STREAM_WINDOW_SECONDS", "60"))
    THROTTLE_INTERVAL_HZ: float = float(os.getenv("THROTTLE_INTERVAL_HZ", "1.0"))
    
    # Active Watchlist
    DEFAULT_WATCHLIST: str = os.getenv("DEFAULT_WATCHLIST", "telecom_ng")
    
    @classmethod
    def load_watchlists(cls) -> Dict[str, Any]:
        watchlists_file = CONFIG_DIR / "watchlists.yaml"
        if watchlists_file.exists():
            with open(watchlists_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                return data.get("watchlists", {})
        return {}

settings = Settings()
watchlists_config = settings.load_watchlists()
