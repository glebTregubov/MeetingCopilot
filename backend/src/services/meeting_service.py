from src.db.repositories import MeetingRepository
from src.models.meeting import Meeting, MeetingCreate


class MeetingService:
    def __init__(self, repository: MeetingRepository):
        self._repository = repository

    async def create(self, payload: MeetingCreate) -> Meeting:
        return await self._repository.create(payload.title)

    async def stop(self, meeting_id: str) -> Meeting:
        return await self._repository.stop(meeting_id)

    async def get(self, meeting_id: str) -> Meeting:
        return await self._repository.get(meeting_id)

    async def list(self) -> list[Meeting]:
        return await self._repository.list()

    async def delete(self, meeting_id: str) -> None:
        await self._repository.delete(meeting_id)
