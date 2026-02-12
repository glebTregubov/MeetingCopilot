from collections import defaultdict

from fastapi import WebSocket


class WebSocketConnectionManager:
    def __init__(self):
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, meeting_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[meeting_id].add(websocket)

    def disconnect(self, meeting_id: str, websocket: WebSocket) -> None:
        if meeting_id in self._connections:
            self._connections[meeting_id].discard(websocket)
            if not self._connections[meeting_id]:
                del self._connections[meeting_id]

    async def broadcast(self, meeting_id: str, payload: dict) -> None:
        for socket in list(self._connections.get(meeting_id, [])):
            await socket.send_json(payload)
