import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from src.core.config import settings

logger = logging.getLogger("comintel.producer")

class KafkaEventProducer:
    """
    Dual-mode event producer:
    1. Uses aiokafka if KAFKA_ENABLED and broker is reachable.
    2. Transparently falls back to an internal high-throughput async event bus for local mode.
    """
    _instance: Optional["KafkaEventProducer"] = None
    
    def __init__(self, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or settings.KAFKA_BOOTSTRAP_SERVERS
        self.kafka_producer = None
        self.use_kafka = False
        self._memory_queues: Dict[str, List[asyncio.Queue]] = {}
        self._event_logs: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def get_instance(cls) -> "KafkaEventProducer":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def start(self):
        if settings.KAFKA_ENABLED:
            try:
                from aiokafka import AIOKafkaProducer
                self.kafka_producer = AIOKafkaProducer(
                    bootstrap_servers=self.bootstrap_servers,
                    value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                    key_serializer=lambda k: k.encode("utf-8") if k else b""
                )
                await self.kafka_producer.start()
                self.use_kafka = True
                logger.info("Connected to Kafka cluster at %s", self.bootstrap_servers)
                return
            except Exception as e:
                logger.warning("Could not connect to Kafka: %s. Using in-memory async event bus.", e)
                self.use_kafka = False
        else:
            logger.info("Kafka disabled by config. Operating in high-throughput local async mode.")
            self.use_kafka = False

    async def stop(self):
        if self.kafka_producer:
            try:
                await self.kafka_producer.stop()
            except Exception:
                pass

    async def send(self, topic: str, key: Optional[str] = None, value: Optional[Dict[str, Any]] = None):
        if value is None:
            return

        # Store in event log for auditing/testing
        if topic not in self._event_logs:
            self._event_logs[topic] = []
        self._event_logs[topic].append(value)
        if len(self._event_logs[topic]) > 2000:
            self._event_logs[topic].pop(0)

        # 1. External Kafka delivery
        if self.use_kafka and self.kafka_producer:
            try:
                await self.kafka_producer.send_and_wait(topic, key=key or "", value=value)
            except Exception as e:
                logger.error("Error publishing to Kafka: %s", e)

        # 2. In-memory async subscriber delivery
        if topic in self._memory_queues:
            for q in self._memory_queues[topic]:
                try:
                    q.put_nowait(value)
                except asyncio.QueueFull:
                    pass

    def subscribe(self, topic: str) -> asyncio.Queue:
        """Subscribe an asyncio consumer queue to a topic."""
        if topic not in self._memory_queues:
            self._memory_queues[topic] = []
        q: asyncio.Queue = asyncio.Queue(maxsize=5000)
        self._memory_queues[topic].append(q)
        return q

    def get_topic_events(self, topic: str) -> List[Dict[str, Any]]:
        return list(self._event_logs.get(topic, []))

    def clear(self):
        self._event_logs.clear()
        for q_list in self._memory_queues.values():
            for q in q_list:
                while not q.empty():
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        break

    def get_total_lag(self) -> int:
        total = 0
        for q_list in self._memory_queues.values():
            for q in q_list:
                total += q.qsize()
        return total
