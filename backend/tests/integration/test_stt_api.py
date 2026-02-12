import base64

from fastapi.testclient import TestClient

from src.main import create_app


class FakeElevenLabsProvider:
    async def transcribe_audio_chunk_base64(self, audio_base64: str, mime_type: str) -> dict[str, str]:
        assert mime_type.startswith('audio/')
        decoded = base64.b64decode(audio_base64)
        assert len(decoded) > 0
        return {'text': 'Decision: launch campaign on Monday'}


class BrokenElevenLabsProvider:
    async def transcribe_audio_chunk_base64(self, audio_base64: str, mime_type: str) -> dict[str, str]:
        raise ValueError('Invalid payload')


def test_stt_chunk_transcription_success() -> None:
    app = create_app()

    with TestClient(app) as client:
        app.state.realtime_providers['elevenlabs'] = FakeElevenLabsProvider()

        payload = {
            'audio_base64': base64.b64encode(b'fake-audio-bytes').decode('utf-8'),
            'mime_type': 'audio/webm',
        }

        response = client.post('/api/stt/elevenlabs/chunk', json=payload)
        assert response.status_code == 200
        assert response.json()['text'] == 'Decision: launch campaign on Monday'


def test_stt_chunk_transcription_invalid_payload() -> None:
    app = create_app()

    with TestClient(app) as client:
        app.state.realtime_providers['elevenlabs'] = BrokenElevenLabsProvider()

        payload = {
            'audio_base64': base64.b64encode(b'fake-audio-bytes').decode('utf-8'),
            'mime_type': 'audio/webm',
        }

        response = client.post('/api/stt/elevenlabs/chunk', json=payload)
        assert response.status_code == 400
