from fastapi.testclient import TestClient

from src.main import create_app


def test_websocket_connect_sends_state_snapshot() -> None:
    app = create_app()

    with TestClient(app) as client:
        created = client.post('/api/meetings', json={'title': 'WS State'}).json()
        meeting_id = created['id']

        with client.websocket_connect(f'/ws/meetings/{meeting_id}') as ws:
            connected = ws.receive_json()
            assert connected['type'] == 'meeting.connected'

            state = ws.receive_json()
            assert state['type'] == 'meeting.state'
            assert state['meeting_id'] == meeting_id
            assert state['payload']['summary'] == ''
            assert state['payload']['insights']['decisions'] == []
