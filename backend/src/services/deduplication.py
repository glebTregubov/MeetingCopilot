from dataclasses import dataclass, field
from difflib import SequenceMatcher
from hashlib import sha1


def normalize_text(value: str) -> str:
    return " ".join(value.lower().strip().split())


def compute_content_hash(value: str) -> str:
    normalized = normalize_text(value)
    return sha1(normalized.encode("utf-8")).hexdigest()


def similarity_ratio(left: str, right: str) -> float:
    return SequenceMatcher(a=normalize_text(left), b=normalize_text(right)).ratio()


@dataclass
class DeduplicationEngine:
    similarity_threshold: float = 0.92
    _known_hashes: set[str] = field(default_factory=set)
    _known_texts: list[str] = field(default_factory=list)

    def is_duplicate(self, text: str) -> bool:
        content_hash = compute_content_hash(text)
        if content_hash in self._known_hashes:
            return True

        for candidate in self._known_texts:
            if similarity_ratio(text, candidate) >= self.similarity_threshold:
                return True

        return False

    def add(self, text: str) -> None:
        self._known_hashes.add(compute_content_hash(text))
        self._known_texts.append(text)

    def add_if_unique(self, text: str) -> bool:
        if self.is_duplicate(text):
            return False
        self.add(text)
        return True
