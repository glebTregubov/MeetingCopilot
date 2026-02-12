from fastapi.testclient import TestClient

from src.main import create_app
from src.services.ai.provider_base import EphemeralToken


class FakeProvider:
    def __init__(self, provider_name: str, client_secret: str):
        self.provider_name = provider_name
        self.client_secret = client_secret

    async def create_ephemeral_token(self) -> EphemeralToken:
        return EphemeralToken(
            provider=self.provider_name,
            client_secret=self.client_secret,
            expires_at=1735689600,
        )


def test_token_endpoint_returns_openai_token():
    app = create_app()

    with TestClient(app) as client:
        app.state.realtime_providers = {
            "openai": FakeProvider("openai", "ephemeral_123"),
        }

        response = client.post("/api/token/ephemeral", json={"provider": "openai"})
        assert response.status_code == 201
        payload = response.json()
        assert payload["provider"] == "openai"
        assert payload["client_secret"] == "ephemeral_123"


def test_token_endpoint_rejects_unknown_provider():
    app = create_app()

    with TestClient(app) as client:
        app.state.realtime_providers = {}
        response = client.post("/api/token/ephemeral", json={"provider": "unknown"})
        assert response.status_code == 400
