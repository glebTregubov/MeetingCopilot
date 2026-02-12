from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Meeting Copilot API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    openai_api_key: str = ""
    elevenlabs_api_key: str = ""
    stt_provider: str = "openai"
    stt_fallback_provider: str = "none"
    ai_provider: str = "openai"
    elevenlabs_stt_model: str = "scribe_v1"
    telegram_bot_token: str = ""
    telegram_whitelist: str = ""
    telegram_default_chat_id: str = ""

    database_url: str = "sqlite+aiosqlite:///./meeting_copilot.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
