from fastapi import APIRouter

from src.api.meetings import router as meetings_router
from src.api.providers import router as providers_router
from src.api.stt import router as stt_router
from src.api.token import router as token_router
from src.api.websocket import router as websocket_router

api_router = APIRouter()
api_router.include_router(meetings_router)
api_router.include_router(providers_router)
api_router.include_router(stt_router)
api_router.include_router(token_router)
api_router.include_router(websocket_router)
