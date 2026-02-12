def parse_whitelist(raw_whitelist: str) -> set[str]:
    if not raw_whitelist:
        return set()

    return {item.strip() for item in raw_whitelist.split(',') if item.strip()}


def is_chat_allowed(chat_id: str, whitelist: set[str]) -> bool:
    if not whitelist:
        return True
    return chat_id in whitelist
