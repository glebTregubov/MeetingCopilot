from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

EventType = Literal[
    "meeting.started",
    "meeting.stopped",
    "transcript.segment",
    "meeting.delta",
    "user.question",
    "bot.answer",
    "meeting.connected",
]


class WebSocketEvent(BaseModel):
    type: EventType
    meeting_id: str
    payload: dict[str, Any] = {}
    timestamp: datetime | None = None
