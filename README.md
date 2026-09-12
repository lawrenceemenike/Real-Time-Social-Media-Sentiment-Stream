# ComIntel: Real-Time Social Intelligence Streaming Platform

ComIntel is an enterprise-grade, event-driven streaming intelligence platform designed to ingest uncontrolled public social media streams (Bluesky Jetstream WebSocket firehose & Mastodon), execute multi-task NLP and commercial intent extraction, maintain stateful sliding-window metrics, detect statistical Z-score anomalies, and deliver sub-second executive intelligence briefings to a dark-mode Next.js analytics surface.

---

## Architecture Topology

```
                         PUBLIC SOCIAL FEEDS
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
          Bluesky Jetstream                 Mastodon Streaming
        (WebSocket Firehose)               (Public/Hashtag API)
                 │                                 │
                 └────────────────┬────────────────┘
                                  │
                                  ▼
                         [ SOURCE ADAPTERS ]
                     Asyncio WebSocket Consumers
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   social.raw    │ (Immutable Kafka Topic)
                         └────────┬────────┘
                                  │
                                  ▼
                     [ VALIDATION & NORMALIZATION ]
               Pre-Enrichment Watchlist Router • Deduplication • LangID
                                  │
                                  ├──► [ deadletter.events ]
                                  ▼
                         ┌──────────────────┐
                         │  social.cleaned  │
                         └────────┬─────────┘
                                  │
                                  ▼
                  [ PARALLEL NLP ENRICHMENT WORKERS ]
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
    Sentiment Analysis      Entity Extraction     Commercial Intent
   (RoBERTa / Lexicon)      (spaCy Normalizer)   (Switching/Complaint)
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ social.enriched  │ (Canonical Analytical Event)
                         └────────┬─────────┘
                                  │
                                  ▼
             [ PURE-PYTHON STATEFUL ENGINE / STREAMING ]
        Watermarking • 1m/5m/1h/24h Windows • Share of Voice • Z-Scores
                                  │
                                  ├──► Parquet Lake (/data/lake/year=YYYY/...)
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │intelligence.anomalies│
                       └──────────┬───────────┘
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
    [ LOCAL SLM AGENT ]                         [ FASTAPI GATEWAY ]
 (Gemma 2B via Ollama)                        REST & 1Hz SSE/WebSocket
Signal-to-Insight Synthesis                             │
            │                                           │
            ▼                                           ▼
  PostgreSQL & Redis Cache ◄─────────────────────► [ COMINTEL UI ]
 (Aggregates, Alerts, State)                     (Next.js / Tailwind CSS)
```

---

## 4 Technical Directives Implemented

1. **Pure-Python Stateful Windowing for Local Mode**:
   - `src/streaming/windows.py` uses vectorized NumPy and Pandas operations inside native `asyncio` tasks to compute 1m, 5m, 1h, and 24h rolling windows, velocities, and Z-scores without requiring external bare-metal PySpark clusters.
2. **Pre-Enrichment Watchlist Router**:
   - `src/transformation/watchlist_router.py` & `src/transformation/normalizer.py` pre-filter high-volume raw streams against `config/watchlists.yaml` prior to invoking heavy NLP models, boosting processing throughput by $>10\times$.
3. **WebSocket & SSE UI Throttling**:
   - FastAPI gateway (`src/api/routes.py` & `src/api/websocket.py`) aggregates streaming events and emits UI snapshots at strictly **1Hz (1-second intervals)** to guarantee zero client-side UI thrashing.
4. **Header Replay Toggle**:
   - The dashboard header provides a one-click toggle switch `[ Source: Live Jetstream | ⏪ Replay Mode (10x) ]` directly triggering calibrated historical stream replays from `data/sample_historical_stream.json`.

---

## Quickstart & Execution

### 1. Run Automated Test Suite
```bash
py -3.11 -m pytest tests/ -v
```

### 2. Launch FastAPI Backend Gateway
```bash
py -3.11 -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Launch Next.js Executive Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the ComIntel Executive Dashboard or `http://localhost:3000/pipeline` for the Pipeline Health DAG.

### 4. Optional: Run Containerized Infrastructure (Docker)
```bash
docker-compose up -d
```
Spins up Kafka, Zookeeper, PostgreSQL, Redis, Prometheus, and Grafana.
