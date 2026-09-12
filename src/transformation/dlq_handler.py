from typing import Any, Dict, Optional
from src.core.schemas import DeadLetterEvent
from src.ingestion.producer import KafkaEventProducer

class DLQHandler:
    """
    Dead-Letter Queue (DLQ) handler routing malformed, toxic,
    or schema-violating events to 'deadletter.events' for audit.
    """
    def __init__(self, producer: Optional[KafkaEventProducer] = None):
        self.producer = producer or KafkaEventProducer.get_instance()
        self.dlq_events = []

    async def route_to_dlq(self, raw_payload: Dict[str, Any], error_reason: str, component: str):
        dlq_event = DeadLetterEvent(
            raw_payload=raw_payload,
            error_reason=error_reason,
            failed_at_component=component
        )
        self.dlq_events.append(dlq_event)
        await self.producer.send("deadletter.events", key=dlq_event.dlq_id, value=dlq_event.dict())
        return dlq_event
