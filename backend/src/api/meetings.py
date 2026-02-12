from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from starlette.responses import HTMLResponse, PlainTextResponse

from src.models.meeting import Meeting, MeetingCreate
from src.services.export_service import ExportService
from src.services.meeting_service import MeetingService

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def get_meeting_service(request: Request) -> MeetingService:
    return request.app.state.meeting_service


def get_export_service(request: Request) -> ExportService:
    return request.app.state.export_service


class SendTelegramExportRequest(BaseModel):
    chat_id: str


@router.get("", response_model=list[Meeting])
async def list_meetings(service: MeetingService = Depends(get_meeting_service)) -> list[Meeting]:
    return await service.list()


@router.post("", response_model=Meeting, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    payload: MeetingCreate,
    service: MeetingService = Depends(get_meeting_service),
) -> Meeting:
    return await service.create(payload)


@router.get("/{meeting_id}", response_model=Meeting)
async def get_meeting(
    meeting_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> Meeting:
    try:
        return await service.get(meeting_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{meeting_id}/stop", response_model=Meeting)
async def stop_meeting(
    meeting_id: str,
    request: Request,
    service: MeetingService = Depends(get_meeting_service),
) -> Meeting:
    try:
        meeting = await service.stop(meeting_id)

        settings = request.app.state.settings
        telegram_chat_id = request.headers.get("x-telegram-chat-id", "").strip() or settings.telegram_default_chat_id
        telegram_bot = request.app.state.telegram_bot
        state_manager = request.app.state.state_manager
        if telegram_chat_id:
            summary = state_manager.get_state(meeting_id).summary
            await telegram_bot.autopost_summary(telegram_chat_id, summary)

        return meeting
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    meeting_id: str,
    service: MeetingService = Depends(get_meeting_service),
) -> None:
    await service.delete(meeting_id)


@router.get("/{meeting_id}/export")
async def export_meeting(
    meeting_id: str,
    request: Request,
    format: str = Query(default="md", pattern="^(md|html)$"),
    service: MeetingService = Depends(get_meeting_service),
    export_service: ExportService = Depends(get_export_service),
):
    try:
        meeting = await service.get(meeting_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    state_manager = request.app.state.state_manager
    state = state_manager.get_state(meeting_id)

    if format == "html":
        body = export_service.render_html(meeting, state)
        return HTMLResponse(content=body)

    body = export_service.render_markdown(meeting, state)
    return PlainTextResponse(content=body)


@router.post("/{meeting_id}/export/telegram", status_code=status.HTTP_202_ACCEPTED)
async def send_export_to_telegram(
    meeting_id: str,
    payload: SendTelegramExportRequest,
    request: Request,
    service: MeetingService = Depends(get_meeting_service),
    export_service: ExportService = Depends(get_export_service),
) -> dict[str, str]:
    try:
        meeting = await service.get(meeting_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    state_manager = request.app.state.state_manager
    telegram_bot = request.app.state.telegram_bot
    state = state_manager.get_state(meeting_id)

    report = export_service.render_markdown(meeting, state)
    await telegram_bot.send_message(payload.chat_id, report)
    return {"status": "queued"}
