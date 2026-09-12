import pytest
from httpx import AsyncClient, ASGITransport
from src.api.main import app

@pytest.mark.asyncio
async def test_api_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_api_metrics_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/metrics/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["total_mentions"] > 0
        assert data["overall_sentiment_pct"] >= 0
        assert "sentiment_ring" in data

@pytest.mark.asyncio
async def test_api_pipeline_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/pipeline/health")
        assert res.status_code == 200
        data = res.json()
        assert "p95_latency_ms" in data
        assert "consumer_lag_events" in data

@pytest.mark.asyncio
async def test_api_top_entities():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/metrics/top-entities")
        assert res.status_code == 200
        entities = res.json()
        assert len(entities) >= 4
        names = [e["entity"] for e in entities]
        assert "MTN Nigeria" in names
        assert "Airtel Nigeria" in names

@pytest.mark.asyncio
async def test_api_executive_ai_query():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/v1/ai/query", json={"query": "What caused the spike in negative sentiment?"})
        assert res.status_code == 200
        data = res.json()
        assert "MTN" in data["answer"] or "sentiment" in data["answer"]
