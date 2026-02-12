from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.models.meeting import Meeting, MeetingCreate
from src.services.meeting_service import MeetingService

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def get_meeting_service(request: Request) -> MeetingService:
    return request.app.state.meeting_service


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

        telegram_chat_id = request.headers.get("x-telegram-chat-id", "").strip()
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
