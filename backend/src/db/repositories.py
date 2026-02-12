from datetime import datetime, timezone
from uuid import uuid4

from src.db.database import Database
from src.models.meeting import Meeting


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class MeetingRepository:
    def __init__(self, database: Database):
        self._database = database

    async def create(self, title: str) -> Meeting:
        meeting_id = str(uuid4())
        now = utc_now_iso()
        async with self._database.connection() as conn:
            await conn.execute(
                """
                INSERT INTO meetings (id, title, status, started_at, ended_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (meeting_id, title, "active", now, None, now, now),
            )

        return await self.get(meeting_id)

    async def get(self, meeting_id: str) -> Meeting:
        async with self._database.connection() as conn:
            cursor = await conn.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
            row = await cursor.fetchone()

        if row is None:
            raise ValueError(f"Meeting not found: {meeting_id}")

        return Meeting.model_validate(dict(row))

    async def list(self) -> list[Meeting]:
        async with self._database.connection() as conn:
            cursor = await conn.execute(
                "SELECT * FROM meetings ORDER BY datetime(created_at) DESC",
            )
            rows = await cursor.fetchall()

        return [Meeting.model_validate(dict(row)) for row in rows]

    async def stop(self, meeting_id: str) -> Meeting:
        now = utc_now_iso()
        async with self._database.connection() as conn:
            await conn.execute(
                """
                UPDATE meetings
                SET status = ?, ended_at = ?, updated_at = ?
                WHERE id = ?
                """,
                ("stopped", now, now, meeting_id),
            )

        return await self.get(meeting_id)

    async def delete(self, meeting_id: str) -> None:
        async with self._database.connection() as conn:
            await conn.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
