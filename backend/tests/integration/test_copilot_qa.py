from fastapi.testclient import TestClient

from src.main import create_app


def test_websocket_user_question_returns_bot_answer():
    app = create_app()

    with TestClient(app) as client:
        with client.websocket_connect('/ws/meetings/m-qa') as websocket:
            connected = websocket.receive_json()
            assert connected['type'] == 'meeting.connected'
            state = websocket.receive_json()
            assert state['type'] == 'meeting.state'

            websocket.send_json(
                {
                    'type': 'transcript.segment',
                    'meeting_id': 'm-qa',
                    'payload': {'text': 'Decision: freeze scope by Friday', 'speaker': 'Lead'},
                }
            )
            delta = websocket.receive_json()
            assert delta['type'] == 'meeting.delta'

            websocket.send_json(
                {
                    'type': 'user.question',
                    'meeting_id': 'm-qa',
                    'payload': {'question': 'List decisions'},
                }
            )
            answer = websocket.receive_json()
            assert answer['type'] == 'bot.answer'
            assert 'Decisions' in answer['payload']['answer']
