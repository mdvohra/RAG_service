def check_confidence(score: float, threshold: float | None = None) -> bool:
    from app.config import settings

    t = threshold if threshold is not None else settings.confidence_threshold
    return score >= t
