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
