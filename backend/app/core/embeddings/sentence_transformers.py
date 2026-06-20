import hashlib
import math

from app.config import settings
from app.core.embeddings.base import BaseEmbeddingProvider


def _simple_hash_embed(text: str, dim: int = None) -> list[float]:
    dim = dim or settings.embedding_dimension
    vec = [0.0] * dim
    for token in text.lower().split():
        h = int(hashlib.md5(token.encode()).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


class SentenceTransformersProvider(BaseEmbeddingProvider):
    """Fallback local embeddings without external deps (deterministic hash-based)."""

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [_simple_hash_embed(t) for t in texts]
