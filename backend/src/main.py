from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.router import api_router
from src.config.settings import get_settings
from src.db.database import Database
from src.db.migrations import apply_migrations
from src.db.repositories import MeetingRepository
from src.integrations.telegram.bot import TelegramBotIntegration
from src.integrations.telegram.commands import TelegramCommandHandler
from src.services.ai.elevenlabs_provider import ElevenLabsRealtimeProvider
from src.services.ai.openai_provider import OpenAIRealtimeProvider
from src.services.ai.prompts import PromptLoader
from src.services.state_manager import StateManager
from src.services.meeting_service import MeetingService
from src.services.websocket_manager import WebSocketConnectionManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings

    database = Database(settings)
    await apply_migrations(database)
    app.state.database = database
    app.state.meeting_repository = MeetingRepository(database)
    app.state.meeting_service = MeetingService(app.state.meeting_repository)
    app.state.state_manager = StateManager(min_update_interval_seconds=30)
    app.state.websocket_manager = WebSocketConnectionManager()
    app.state.telegram_bot = TelegramBotIntegration(settings=settings, command_handler=TelegramCommandHandler())
    app.state.prompt_loader = PromptLoader()
    app.state.realtime_providers = {
        "openai": OpenAIRealtimeProvider(settings),
        "elevenlabs": ElevenLabsRealtimeProvider(settings),
    }

    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.include_router(api_router)

    @app.get("/health", tags=["system"])
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
