from src.main import app


def test_app_title() -> None:
    assert app.title == "Meeting Copilot API"
