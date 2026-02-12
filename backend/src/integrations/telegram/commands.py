from dataclasses import dataclass

from src.integrations.telegram.formatters import format_summary


@dataclass
class TelegramCommandHandler:
    async def start_meeting(self) -> str:
        return "Meeting start requested. Use web UI controls to begin recording."

    async def stop_meeting(self) -> str:
        return "Meeting stop requested. Use web UI controls to stop recording."

    async def summary(self, summary_text: str) -> str:
        return format_summary(summary_text)

    async def actions(self, items: list[str]) -> str:
        if not items:
            return "No action items yet."
        return "*Action Items*\n" + "\n".join(f"- {item}" for item in items)

    async def decisions(self, items: list[str]) -> str:
        if not items:
            return "No decisions yet."
        return "*Decisions*\n" + "\n".join(f"- {item}" for item in items)

    async def ask(self, answer: str) -> str:
        return answer
