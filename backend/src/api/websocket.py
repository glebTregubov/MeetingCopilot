from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

from src.models.websocket_events import WebSocketEvent

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_ws(websocket: WebSocket, meeting_id: str) -> None:
    manager = websocket.app.state.websocket_manager
    state_manager = websocket.app.state.state_manager

    await manager.connect(meeting_id, websocket)
    await websocket.send_json(
        {
            "type": "meeting.connected",
            "meeting_id": meeting_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    try:
        while True:
            raw_payload = await websocket.receive_json()
            event = WebSocketEvent.model_validate(raw_payload)

            if event.type == "transcript.segment":
                payload = event.payload
                text = str(payload.get("text", "")).strip()
                speaker = payload.get("speaker")

                if not text:
                    continue

                delta = state_manager.process_transcript_segment(
                    meeting_id=meeting_id,
                    text=text,
                    speaker=str(speaker) if speaker else None,
                )

                if delta is not None:
                    await manager.broadcast(
                        meeting_id,
                        {
                            "type": "meeting.delta",
                            "meeting_id": meeting_id,
                            "payload": delta,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )

            if event.type == "user.question":
                payload = event.payload
                question = str(payload.get("question", "")).strip()
                if not question:
                    continue

                answer = state_manager.answer_question(meeting_id, question)
                await manager.broadcast(
                    meeting_id,
                    {
                        "type": "bot.answer",
                        "meeting_id": meeting_id,
                        "payload": {
                            "question": question,
                            "answer": answer,
                        },
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
    except WebSocketDisconnect:
        manager.disconnect(meeting_id, websocket)
