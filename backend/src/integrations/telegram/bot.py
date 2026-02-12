from dataclasses import dataclass

import httpx

from src.config.settings import Settings
from src.integrations.telegram.commands import TelegramCommandHandler
from src.integrations.telegram.formatters import format_summary
from src.integrations.telegram.security import is_chat_allowed, parse_whitelist


@dataclass
class TelegramBotIntegration:
    settings: Settings
    command_handler: TelegramCommandHandler

    @property
    def enabled(self) -> bool:
        return bool(self.settings.telegram_bot_token)

    async def send_message(self, chat_id: str, text: str) -> bool:
        if not self.enabled:
            return False

        whitelist = parse_whitelist(self.settings.telegram_whitelist)
        if not is_chat_allowed(chat_id, whitelist):
            return False

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{self.settings.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "MarkdownV2",
                    "disable_web_page_preview": True,
                },
            )
            response.raise_for_status()

        return True

    async def autopost_summary(self, chat_id: str, summary: str) -> bool:
        return await self.send_message(chat_id, format_summary(summary))
