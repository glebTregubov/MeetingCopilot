from pathlib import Path

from fastapi.testclient import TestClient

from src.config.settings import get_settings
from src.main import create_app


def test_meetings_api_crud(tmp_path: Path, monkeypatch):
    db_path = tmp_path / "api_test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
    get_settings.cache_clear()

    app = create_app()
    with TestClient(app) as client:
        create_response = client.post("/api/meetings", json={"title": "Planning"})
        assert create_response.status_code == 201
        meeting = create_response.json()
        meeting_id = meeting["id"]

        list_response = client.get("/api/meetings")
        assert list_response.status_code == 200
        assert any(item["id"] == meeting_id for item in list_response.json())

        get_response = client.get(f"/api/meetings/{meeting_id}")
        assert get_response.status_code == 200
        assert get_response.json()["title"] == "Planning"

        stop_response = client.post(f"/api/meetings/{meeting_id}/stop")
        assert stop_response.status_code == 200
        assert stop_response.json()["status"] == "stopped"

        delete_response = client.delete(f"/api/meetings/{meeting_id}")
        assert delete_response.status_code == 204

        missing_response = client.get(f"/api/meetings/{meeting_id}")
        assert missing_response.status_code == 404

    get_settings.cache_clear()
