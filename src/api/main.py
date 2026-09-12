import asyncio
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.api.websocket import ws_router
from src.core.pipeline import pipeline_coordinator
from src.ingestion.bluesky_jetstream import BlueskyJetstreamConsumer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("comintel.api.main")

bluesky_consumer = BlueskyJetstreamConsumer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: start pipeline workers and live source consumer
    logger.info("Initializing ComIntel Streaming Platform Gateway...")
    await pipeline_coordinator.start()
    
    # Start live Bluesky Jetstream consumer in background
    try:
        await bluesky_consumer.start()
        logger.info("Bluesky Jetstream Consumer launched.")
    except Exception as e:
        logger.warning("Could not launch Bluesky Jetstream consumer: %s", e)

    yield

    # Shutdown
    logger.info("Shutting down ComIntel Streaming Platform Gateway...")
    await bluesky_consumer.stop()
    await pipeline_coordinator.stop()

app = FastAPI(
    title="ComIntel - Real-Time Social Intelligence Streaming Platform",
    description="Schema-Driven & Event-Driven Real-Time Social Analytics API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "comintel-streaming-platform",
        "version": "1.0.0",
        "jetstream_connected": bluesky_consumer.running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
