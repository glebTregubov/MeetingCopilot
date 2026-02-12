from datetime import datetime, timezone

from src.models.insights import ActionItem, Decision, OpenQuestion, Risk
from src.models.meeting import Meeting
from src.services.export_service import ExportService
from src.services.state_manager import MeetingState


def build_meeting() -> Meeting:
    now = datetime.now(timezone.utc)
    return Meeting(
        id='meeting-1',
        title='Weekly Sync',
        status='stopped',
        started_at=now,
        ended_at=now,
        created_at=now,
        updated_at=now,
    )


def build_state() -> MeetingState:
    now = datetime.now(timezone.utc)
    return MeetingState(
        summary='- Key update: release approved',
        decisions=[Decision(id='d1', meeting_id='meeting-1', content='Ship v1 on Monday', created_at=now)],
        actions=[ActionItem(id='a1', meeting_id='meeting-1', content='Prepare release notes', created_at=now)],
        risks=[Risk(id='r1', meeting_id='meeting-1', content='Infra saturation risk', created_at=now)],
        open_questions=[
            OpenQuestion(id='q1', meeting_id='meeting-1', content='Need legal sign-off?', created_at=now)
        ],
    )


def test_render_markdown_contains_core_sections() -> None:
    service = ExportService()
    report = service.render_markdown(build_meeting(), build_state())

    assert '# Meeting Report: Weekly Sync' in report
    assert '## Summary' in report
    assert '## Decisions' in report
    assert '## Action Items' in report
    assert '## Risks' in report
    assert '## Open Questions' in report
    assert 'Ship v1 on Monday' in report


def test_render_html_contains_core_sections() -> None:
    service = ExportService()
    report = service.render_html(build_meeting(), build_state())

    assert '<h1>Meeting Report: Weekly Sync</h1>' in report
    assert '<h2>Summary</h2>' in report
    assert 'Prepare release notes' in report
