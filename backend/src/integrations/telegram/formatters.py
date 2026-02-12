SPECIAL_CHARS = r"_[]()~`>#+-=|{}.!"


def escape_markdown_v2(text: str) -> str:
    escaped = text
    for char in SPECIAL_CHARS:
        escaped = escaped.replace(char, f"\\{char}")
    return escaped


def format_summary(summary: str) -> str:
    heading = "*Meeting Summary*"
    body = escape_markdown_v2(summary or "No summary yet")
    return f"{heading}\n{body}"
