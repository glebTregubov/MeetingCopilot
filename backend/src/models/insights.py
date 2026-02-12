from datetime import datetime
from typing import Literal

from pydantic import BaseModel

InsightKind = Literal["decision", "action", "risk", "open_question"]


class Decision(BaseModel):
    id: str
    meeting_id: str
    content: str
    created_at: datetime


class ActionItem(BaseModel):
    id: str
    meeting_id: str
    content: str
    owner: str | None = None
    due_date: datetime | None = None
    created_at: datetime


class Risk(BaseModel):
    id: str
    meeting_id: str
    content: str
    created_at: datetime


class OpenQuestion(BaseModel):
    id: str
    meeting_id: str
    content: str
    created_at: datetime
