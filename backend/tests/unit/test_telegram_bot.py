import pytest

from src.integrations.telegram.commands import TelegramCommandHandler
from src.integrations.telegram.formatters import escape_markdown_v2
from src.integrations.telegram.security import is_chat_allowed, parse_whitelist


def test_parse_whitelist_and_access_check() -> None:
    whitelist = parse_whitelist('1001, 1002 ,1003')
    assert whitelist == {'1001', '1002', '1003'}
    assert is_chat_allowed('1002', whitelist) is True
    assert is_chat_allowed('9999', whitelist) is False


def test_escape_markdown_v2() -> None:
    escaped = escape_markdown_v2('Hello (team)! #update')
    assert '\\(' in escaped
    assert '\\)' in escaped
    assert '\\!' in escaped
    assert '\\#' in escaped


@pytest.mark.asyncio
async def test_command_handler_summary() -> None:
    handler = TelegramCommandHandler()
    text = await handler.summary('Decision: ship v1')
    assert 'Meeting Summary' in text
