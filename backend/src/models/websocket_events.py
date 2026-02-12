from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel

EventType = Literal[
    "meeting.started",
    "meeting.stopped",
    "meeting.state",
    "transcript.segment",
    "transcript.segments",
    "meeting.delta",
    "meeting.command",
    "user.question",
    "bot.answer",
    "bot.flag",
    "provider.status",
    "meeting.connected",
]


class WebSocketEvent(BaseModel):
    type: EventType
    meeting_id: str
    payload: dict[str, Any] = {}
    timestamp: datetime | None = None
