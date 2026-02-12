from fastapi.testclient import TestClient

from src.main import create_app


def test_e2e_smoke_meeting_flow() -> None:
    app = create_app()

    with TestClient(app) as client:
        created = client.post('/api/meetings', json={'title': 'E2E Smoke'}).json()
        meeting_id = created['id']

        with client.websocket_connect(f'/ws/meetings/{meeting_id}') as ws:
            connected = ws.receive_json()
            assert connected['type'] == 'meeting.connected'

            ws.send_json(
                {
                    'type': 'transcript.segment',
                    'meeting_id': meeting_id,
                    'payload': {'speaker': 'PM', 'text': 'Decision: release candidate approved'},
                }
            )
            delta = ws.receive_json()
            assert delta['type'] == 'meeting.delta'

        stopped = client.post(f'/api/meetings/{meeting_id}/stop')
        assert stopped.status_code == 200
        assert stopped.json()['status'] == 'stopped'

        export_md = client.get(f'/api/meetings/{meeting_id}/export?format=md')
        assert export_md.status_code == 200
        assert 'Meeting Report' in export_md.text
        assert 'Decision' in export_md.text
