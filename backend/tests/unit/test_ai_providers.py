from pathlib import Path

import pytest

from src.config.settings import get_settings
from src.services.ai.elevenlabs_provider import ElevenLabsRealtimeProvider
from src.services.ai.openai_provider import OpenAIRealtimeProvider
from src.services.ai.prompts import PromptLoader


@pytest.mark.asyncio
async def test_openai_provider_requires_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    get_settings.cache_clear()
    provider = OpenAIRealtimeProvider(get_settings())

    with pytest.raises(ValueError):
        await provider.create_ephemeral_token()

    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_elevenlabs_provider_returns_placeholder_token(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "elv_test_key")
    get_settings.cache_clear()
    provider = ElevenLabsRealtimeProvider(get_settings())

    token = await provider.create_ephemeral_token()

    assert token.provider == "elevenlabs"
    assert token.client_secret == "elv_test_key"

    get_settings.cache_clear()


def test_prompt_loader_load_all(tmp_path: Path):
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "structuring.md").write_text("hello", encoding="utf-8")
    (prompts_dir / "qa.md").write_text("world", encoding="utf-8")

    loader = PromptLoader(prompts_dir=prompts_dir)

    all_prompts = loader.load_all()
    assert all_prompts["structuring"] == "hello"
    assert all_prompts["qa"] == "world"
