import sys
from pathlib import Path
import pytest

# Ensure project root is on sys.path
root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

from src.ingestion.producer import KafkaEventProducer

@pytest.fixture(autouse=True)
def reset_producer():
    producer = KafkaEventProducer.get_instance()
    producer.clear()
    yield
    producer.clear()
