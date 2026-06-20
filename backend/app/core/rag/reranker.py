from app.config import settings
from app.core.rag.query_rewrite import RetrievedChunk


def rerank_chunks(query: str, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
    if not chunks:
        return []

    if not settings.rerank_enabled:
        return chunks[: settings.rerank_top_k]

    query_terms = {t for t in query.lower().split() if len(t) > 2}

    def score_chunk(chunk: RetrievedChunk) -> float:
        content_lower = chunk.content.lower()
        overlap = sum(1 for t in query_terms if t in content_lower) / max(len(query_terms), 1)
        phrase_bonus = 0.15 if query.lower() in content_lower else 0.0
        return chunk.score * 0.6 + overlap * 0.35 + phrase_bonus

    ranked = sorted(chunks, key=score_chunk, reverse=True)
    return ranked[: settings.rerank_top_k]
