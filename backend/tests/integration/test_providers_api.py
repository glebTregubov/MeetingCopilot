from fastapi.testclient import TestClient

from src.main import create_app


def test_get_stt_provider_returns_active_and_available() -> None:
    app = create_app()

    with TestClient(app) as client:
        response = client.get('/api/providers/stt')
        assert response.status_code == 200
        payload = response.json()
        assert payload['active'] in {'openai', 'elevenlabs'}
        assert 'openai' in payload['available']
        assert 'elevenlabs' in payload['available']


def test_set_stt_provider_switches_active_provider() -> None:
    app = create_app()

    with TestClient(app) as client:
        set_response = client.post('/api/providers/stt', json={'provider': 'elevenlabs'})
        assert set_response.status_code == 200
        assert set_response.json()['active'] == 'elevenlabs'

        get_response = client.get('/api/providers/stt')
        assert get_response.status_code == 200
        assert get_response.json()['active'] == 'elevenlabs'


def test_set_stt_provider_rejects_unknown_provider() -> None:
    app = create_app()

    with TestClient(app) as client:
        response = client.post('/api/providers/stt', json={'provider': 'invalid-provider'})
        assert response.status_code == 400
