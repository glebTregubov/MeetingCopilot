from pathlib import Path

import pytest

from src.config.settings import get_settings
from src.db.database import Database
from src.db.migrations import apply_migrations
from src.db.repositories import MeetingRepository
from src.models.meeting import MeetingCreate
from src.services.meeting_service import MeetingService


@pytest.mark.asyncio
async def test_meeting_service_create_get_stop_delete(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "service_test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
    get_settings.cache_clear()

    settings = get_settings()
    database = Database(settings)
    await apply_migrations(database)

    service = MeetingService(MeetingRepository(database))

    created = await service.create(MeetingCreate(title="Weekly sync"))
    assert created.title == "Weekly sync"
    assert created.status == "active"

    fetched = await service.get(created.id)
    assert fetched.id == created.id

    stopped = await service.stop(created.id)
    assert stopped.status == "stopped"
    assert stopped.ended_at is not None

    await service.delete(created.id)

    with pytest.raises(ValueError):
        await service.get(created.id)

    get_settings.cache_clear()
