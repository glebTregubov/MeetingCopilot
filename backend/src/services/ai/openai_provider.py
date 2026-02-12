from typing import Any

import httpx

from src.config.settings import Settings
from src.services.ai.provider_base import EphemeralToken, RealtimeProvider


class OpenAIRealtimeProvider(RealtimeProvider):
    provider_name = "openai"

    def __init__(self, settings: Settings):
        self._settings = settings

    async def create_ephemeral_token(self) -> EphemeralToken:
        if not self._settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured")

        payload = {
            "model": "gpt-4o-realtime-preview",
            "voice": "alloy",
        }

        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data: dict[str, Any] = response.json()

        client_secret = data.get("client_secret", {}).get("value")
        if not client_secret:
            raise ValueError("OpenAI token response did not include client_secret.value")

        return EphemeralToken(
            provider=self.provider_name,
            client_secret=client_secret,
            expires_at=data.get("expires_at"),
            raw=data,
        )
