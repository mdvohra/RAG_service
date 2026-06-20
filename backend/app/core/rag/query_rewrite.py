from dataclasses import dataclass
from typing import Any

from app.config import settings
from app.core.llm.base import LLMMessage
from app.core.llm.factory import get_llm_provider


@dataclass
class RetrievedChunk:
    id: str
    content: str
    score: float
    metadata: dict[str, Any]
    filename: str


async def rewrite_query(query: str) -> str:
    if not settings.query_rewrite_enabled:
        return query
    llm = get_llm_provider()
    rewritten = await llm.complete(
        "Rewrite the user query for document search. Return only the rewritten query.",
        [LLMMessage(role="user", content=query)],
    )
    return rewritten.strip() or query


def compute_confidence(scores: list[float]) -> float:
    if not scores:
        return 0.0
    top = sorted(scores, reverse=True)[:3]
    return sum(top) / len(top)


def should_fallback(confidence: float) -> bool:
    return confidence < settings.soft_confidence_threshold


def should_strict_rag(confidence: float) -> bool:
    return confidence >= settings.confidence_threshold


def should_soft_rag(confidence: float) -> bool:
    return settings.soft_confidence_threshold <= confidence < settings.confidence_threshold
