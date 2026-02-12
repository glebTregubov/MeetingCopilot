from contextlib import asynccontextmanager
from pathlib import Path

import aiosqlite

from src.config.settings import Settings


class Database:
    def __init__(self, settings: Settings):
        self._settings = settings

    @property
    def db_path(self) -> Path:
        db_url = self._settings.database_url
        if db_url.startswith("sqlite+aiosqlite:///"):
            raw_path = db_url.removeprefix("sqlite+aiosqlite:///")
            return Path(raw_path)
        return Path("meeting_copilot.db")

    @asynccontextmanager
    async def connection(self):
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = await aiosqlite.connect(self.db_path)
        conn.row_factory = aiosqlite.Row
        try:
            yield conn
            await conn.commit()
        finally:
            await conn.close()
