from src.services.state_manager import StateManager


def test_state_manager_builds_summary_and_insights() -> None:
    manager = StateManager(min_update_interval_seconds=0)

    delta_1 = manager.process_transcript_segment("m1", "Decision: move launch to Monday", "Alice")
    assert delta_1 is not None
    assert "Alice: Decision: move launch to Monday" in delta_1["summary"]
    assert len(delta_1["insights"]["decisions"]) == 1

    delta_2 = manager.process_transcript_segment("m1", "Action: prepare customer email", "Bob")
    assert delta_2 is not None
    assert len(delta_2["insights"]["actions"]) == 1


def test_state_manager_deduplicates_repeated_insights() -> None:
    manager = StateManager(min_update_interval_seconds=0)

    manager.process_transcript_segment("m2", "Risk: API timeout spike")
    delta = manager.process_transcript_segment("m2", "risk: api timeout spike")

    assert delta is not None
    assert len(delta["insights"]["risks"]) == 1
