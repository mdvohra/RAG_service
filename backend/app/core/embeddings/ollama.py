import httpx

from app.config import settings
from app.core.embeddings.base import BaseEmbeddingProvider


class OllamaEmbeddingProvider(BaseEmbeddingProvider):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        base = settings.ollama_base_url.rstrip("/")
        async with httpx.AsyncClient(timeout=120.0) as client:
            vectors = []
            for text in texts:
                resp = await client.post(
                    f"{base}/api/embeddings",
                    json={"model": settings.embedding_model, "prompt": text},
                )
                resp.raise_for_status()
                vectors.append(resp.json()["embedding"])
            return vectors
