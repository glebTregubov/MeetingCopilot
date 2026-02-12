from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class EphemeralToken:
    provider: str
    client_secret: str
    expires_at: int | None = None
    raw: dict[str, Any] | None = None


class RealtimeProvider(ABC):
    provider_name: str

    @abstractmethod
    async def create_ephemeral_token(self) -> EphemeralToken:
        raise NotImplementedError
