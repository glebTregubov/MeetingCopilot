import base64
from typing import Any

import httpx

from src.config.settings import Settings
from src.services.ai.provider_base import EphemeralToken, RealtimeProvider


class ElevenLabsRealtimeProvider(RealtimeProvider):
    provider_name = "elevenlabs"

    def __init__(self, settings: Settings):
        self._settings = settings

    async def create_ephemeral_token(self) -> EphemeralToken:
        if not self._settings.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured")

        return EphemeralToken(
            provider=self.provider_name,
            client_secret=self._settings.elevenlabs_api_key,
            expires_at=None,
            raw={"note": "Using API key as placeholder until dedicated ephemeral token flow is added."},
        )

    async def transcribe_audio_chunk_base64(self, audio_base64: str, mime_type: str) -> dict[str, Any]:
        if not self._settings.elevenlabs_api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured")

        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as exc:
            raise ValueError("Invalid base64 audio payload") from exc

        headers = {
            "xi-api-key": self._settings.elevenlabs_api_key,
        }

        files = {
            "file": ("chunk.webm", audio_bytes, mime_type),
        }
        data = {
            "model_id": self._settings.elevenlabs_stt_model,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                headers=headers,
                data=data,
                files=files,
            )
            response.raise_for_status()
            payload: dict[str, Any] = response.json()

        text = (
            payload.get("text")
            or payload.get("transcript")
            or payload.get("result", {}).get("text")
            or payload.get("data", {}).get("text")
            or ""
        )

        return {
            "text": str(text).strip(),
            "raw": payload,
        }
