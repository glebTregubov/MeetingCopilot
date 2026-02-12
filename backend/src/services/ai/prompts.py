from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[4] / "config" / "prompts"


class PromptLoader:
    def __init__(self, prompts_dir: Path | None = None):
        self._prompts_dir = prompts_dir or PROMPTS_DIR

    def load(self, name: str) -> str:
        path = self._prompts_dir / f"{name}.md"
        if not path.exists():
            raise FileNotFoundError(f"Prompt not found: {path}")
        return path.read_text(encoding="utf-8")

    def load_all(self) -> dict[str, str]:
        if not self._prompts_dir.exists():
            return {}

        prompts: dict[str, str] = {}
        for path in sorted(self._prompts_dir.glob("*.md")):
            prompts[path.stem] = path.read_text(encoding="utf-8")
        return prompts
