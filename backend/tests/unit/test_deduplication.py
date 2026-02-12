from src.services.deduplication import DeduplicationEngine, compute_content_hash, similarity_ratio


def test_compute_content_hash_normalizes_whitespace_and_case() -> None:
    left = compute_content_hash(" Decision: Approve plan ")
    right = compute_content_hash("decision:   approve PLAN")
    assert left == right


def test_similarity_ratio_detects_near_duplicates() -> None:
    ratio = similarity_ratio("Action: ship v1 by Friday", "action ship v1 by friday")
    assert ratio > 0.9


def test_deduplication_engine_add_if_unique() -> None:
    engine = DeduplicationEngine(similarity_threshold=0.9)
    assert engine.add_if_unique("Risk: downtime in region A") is True
    assert engine.add_if_unique("risk: downtime in region a") is False
