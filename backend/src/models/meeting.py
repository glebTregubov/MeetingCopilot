from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

MeetingStatus = Literal["active", "stopped"]


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class Meeting(BaseModel):
    id: str
    title: str
    status: MeetingStatus
    started_at: datetime
    ended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TranscriptSegment(BaseModel):
    id: str
    meeting_id: str
    speaker: str | None = None
    text: str
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime


class LiveSummarySnapshot(BaseModel):
    id: str
    meeting_id: str
    summary: str
    created_at: datetime
