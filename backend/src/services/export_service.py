from dataclasses import dataclass

from src.models.meeting import Meeting
from src.services.state_manager import MeetingState


@dataclass
class ExportService:
  @staticmethod
  def _section_lines(items: list[str]) -> list[str]:
    return [f"- {item}" for item in items] if items else ["- None"]

  def render_markdown(self, meeting: Meeting, state: MeetingState) -> str:
    decisions = state.decisions or []
    actions = state.actions or []
    risks = state.risks or []
    questions = state.open_questions or []

    lines = [
      f"# Meeting Report: {meeting.title}",
      "",
      f"- Meeting ID: `{meeting.id}`",
      f"- Status: `{meeting.status}`",
      f"- Started At: `{meeting.started_at.isoformat()}`",
      f"- Ended At: `{meeting.ended_at.isoformat() if meeting.ended_at else 'N/A'}`",
      "",
      "## Summary",
      state.summary or "No summary available.",
      "",
      "## Decisions",
      *self._section_lines([item.content for item in decisions]),
      "",
      "## Action Items",
      *self._section_lines([item.content for item in actions]),
      "",
      "## Risks",
      *self._section_lines([item.content for item in risks]),
      "",
      "## Open Questions",
      *self._section_lines([item.content for item in questions]),
    ]
    return "\n".join(lines)

  def render_html(self, meeting: Meeting, state: MeetingState) -> str:
    def list_html(items: list[str]) -> str:
      if not items:
        return "<li>None</li>"
      return "".join(f"<li>{item}</li>" for item in items)

    return f"""
<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Meeting Report - {meeting.title}</title>
  </head>
  <body>
    <h1>Meeting Report: {meeting.title}</h1>
    <p><strong>Meeting ID:</strong> {meeting.id}</p>
    <p><strong>Status:</strong> {meeting.status}</p>
    <h2>Summary</h2>
    <pre>{state.summary or 'No summary available.'}</pre>
    <h2>Decisions</h2>
    <ul>{list_html([item.content for item in state.decisions])}</ul>
    <h2>Action Items</h2>
    <ul>{list_html([item.content for item in state.actions])}</ul>
    <h2>Risks</h2>
    <ul>{list_html([item.content for item in state.risks])}</ul>
    <h2>Open Questions</h2>
    <ul>{list_html([item.content for item in state.open_questions])}</ul>
  </body>
</html>
""".strip()
