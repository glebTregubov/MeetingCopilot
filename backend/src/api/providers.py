from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/providers", tags=["providers"])


class SttProviderResponse(BaseModel):
    active: str
    available: list[str]


class SetSttProviderRequest(BaseModel):
    provider: str


@router.get("/stt", response_model=SttProviderResponse)
async def get_stt_provider(request: Request) -> SttProviderResponse:
    providers: dict[str, object] = request.app.state.realtime_providers
    active_provider = request.app.state.active_stt_provider
    return SttProviderResponse(active=active_provider, available=sorted(providers.keys()))


@router.post("/stt", response_model=SttProviderResponse)
async def set_stt_provider(payload: SetSttProviderRequest, request: Request) -> SttProviderResponse:
    provider = payload.provider.strip().lower()
    providers: dict[str, object] = request.app.state.realtime_providers
    if provider not in providers:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    request.app.state.active_stt_provider = provider
    return SttProviderResponse(active=provider, available=sorted(providers.keys()))
