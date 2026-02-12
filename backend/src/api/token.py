from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/token", tags=["token"])


class EphemeralTokenRequest(BaseModel):
    provider: str = "openai"


class EphemeralTokenResponse(BaseModel):
    provider: str
    client_secret: str
    expires_at: int | None = None


@router.post("/ephemeral", response_model=EphemeralTokenResponse, status_code=status.HTTP_201_CREATED)
async def create_ephemeral_token(payload: EphemeralTokenRequest, request: Request) -> EphemeralTokenResponse:
    provider_name = payload.provider.lower()
    providers: dict[str, object] = request.app.state.realtime_providers
    provider = providers.get(provider_name)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider_name}",
        )

    try:
        token = await provider.create_ephemeral_token()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create ephemeral token for {provider_name}",
        ) from exc

    return EphemeralTokenResponse(
        provider=token.provider,
        client_secret=token.client_secret,
        expires_at=token.expires_at,
    )
