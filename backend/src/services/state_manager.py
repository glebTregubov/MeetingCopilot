from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from src.models.insights import ActionItem, Decision, OpenQuestion, Risk
from src.services.deduplication import DeduplicationEngine


@dataclass
class MeetingState:
    transcript_lines: list[str] = field(default_factory=list)
    summary: str = ""
    decisions: list[Decision] = field(default_factory=list)
    actions: list[ActionItem] = field(default_factory=list)
    risks: list[Risk] = field(default_factory=list)
    open_questions: list[OpenQuestion] = field(default_factory=list)
    last_updated_at: datetime | None = None


class StateManager:
    def __init__(
        self,
        min_update_interval_seconds: int = 30,
    ):
        self._min_update_interval = timedelta(seconds=min_update_interval_seconds)
        self._states: dict[str, MeetingState] = {}
        self._dedup_by_meeting: dict[str, DeduplicationEngine] = {}

    def _state_for(self, meeting_id: str) -> MeetingState:
        if meeting_id not in self._states:
            self._states[meeting_id] = MeetingState()
            self._dedup_by_meeting[meeting_id] = DeduplicationEngine()
        return self._states[meeting_id]

    def _should_update(self, state: MeetingState, now: datetime) -> bool:
        if state.last_updated_at is None:
            return True
        return now - state.last_updated_at >= self._min_update_interval

    def _extract_insight(self, meeting_id: str, text: str):
        normalized = text.strip()
        lowered = normalized.lower()
        now = datetime.now(timezone.utc)

        if lowered.startswith("decision:"):
            return "decisions", Decision(
                id=str(uuid4()),
                meeting_id=meeting_id,
                content=normalized.split(":", 1)[1].strip(),
                created_at=now,
            )
        if lowered.startswith("action:"):
            return "actions", ActionItem(
                id=str(uuid4()),
                meeting_id=meeting_id,
                content=normalized.split(":", 1)[1].strip(),
                owner=None,
                due_date=None,
                created_at=now,
            )
        if lowered.startswith("risk:"):
            return "risks", Risk(
                id=str(uuid4()),
                meeting_id=meeting_id,
                content=normalized.split(":", 1)[1].strip(),
                created_at=now,
            )
        if lowered.startswith("question:"):
            return "open_questions", OpenQuestion(
                id=str(uuid4()),
                meeting_id=meeting_id,
                content=normalized.split(":", 1)[1].strip(),
                created_at=now,
            )

        return None

    def _build_summary(self, lines: list[str]) -> str:
        if not lines:
            return ""
        latest = lines[-5:]
        return "\n".join(f"- {line}" for line in latest)

    def get_state(self, meeting_id: str) -> MeetingState:
        return self._state_for(meeting_id)

    def answer_question(self, meeting_id: str, question: str) -> str:
        state = self._state_for(meeting_id)
        if not state.transcript_lines:
            return "I do not have enough meeting context yet. Please continue the meeting first."

        question_text = question.strip().lower()

        if "summary" in question_text:
            return state.summary or self._build_summary(state.transcript_lines)

        if "decision" in question_text:
            if not state.decisions:
                return "No decisions captured yet."
            return "Decisions:\n" + "\n".join(f"- {item.content}" for item in state.decisions[-5:])

        if "action" in question_text:
            if not state.actions:
                return "No action items captured yet."
            return "Action items:\n" + "\n".join(f"- {item.content}" for item in state.actions[-5:])

        latest_context = state.transcript_lines[-3:]
        return (
            "Based on recent context:\n"
            + "\n".join(f"- {line}" for line in latest_context)
            + "\nQuestion: "
            + question.strip()
        )

    def process_transcript_segment(self, meeting_id: str, text: str, speaker: str | None = None) -> dict | None:
        now = datetime.now(timezone.utc)
        state = self._state_for(meeting_id)
        dedup = self._dedup_by_meeting[meeting_id]

        line = f"{speaker}: {text}" if speaker else text
        state.transcript_lines.append(line)

        extracted = self._extract_insight(meeting_id, text)
        if extracted is not None:
            collection_name, item = extracted
            if dedup.add_if_unique(item.content):
                getattr(state, collection_name).append(item)

        if not self._should_update(state, now):
            return None

        state.summary = self._build_summary(state.transcript_lines)
        state.last_updated_at = now

        return {
            "summary": state.summary,
            "insights": {
                "decisions": [item.model_dump(mode="json") for item in state.decisions],
                "actions": [item.model_dump(mode="json") for item in state.actions],
                "risks": [item.model_dump(mode="json") for item in state.risks],
                "open_questions": [item.model_dump(mode="json") for item in state.open_questions],
            },
            "updated_at": state.last_updated_at.isoformat(),
        }
