from abc import ABC, abstractmethod
from typing import Optional

class BaseStreamConsumer(ABC):
    """Abstract base class for all streaming ingestion source adapters."""
    
    @abstractmethod
    async def start(self) -> None:
        """Starts the persistent streaming consumer."""
        pass

    @abstractmethod
    async def stop(self) -> None:
        """Gracefully stops the consumer."""
        pass
