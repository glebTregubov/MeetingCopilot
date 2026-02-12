from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/stt", tags=["stt"])


class ElevenLabsChunkRequest(BaseModel):
    audio_base64: str
    mime_type: str = "audio/webm"


class ElevenLabsChunkResponse(BaseModel):
    text: str


@router.post("/elevenlabs/chunk", response_model=ElevenLabsChunkResponse)
async def transcribe_elevenlabs_chunk(payload: ElevenLabsChunkRequest, request: Request) -> ElevenLabsChunkResponse:
    providers = request.app.state.realtime_providers
    elevenlabs_provider = providers.get("elevenlabs")
    if elevenlabs_provider is None:
        raise HTTPException(status_code=500, detail="ElevenLabs provider is not available")

    if not hasattr(elevenlabs_provider, "transcribe_audio_chunk_base64"):
        raise HTTPException(status_code=500, detail="ElevenLabs transcription method is not configured")

    try:
        result = await elevenlabs_provider.transcribe_audio_chunk_base64(
            payload.audio_base64,
            payload.mime_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Failed to transcribe audio chunk with ElevenLabs") from exc

    return ElevenLabsChunkResponse(text=str(result.get("text", "")).strip())
