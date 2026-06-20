from openai import AsyncOpenAI

from app.config import settings
from app.core.embeddings.base import BaseEmbeddingProvider


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        client = AsyncOpenAI(api_key=settings.openai_api_key or settings.llm_api_key)
        resp = await client.embeddings.create(
            model=settings.embedding_model,
            input=texts,
            dimensions=settings.embedding_dimension,
        )
        return [d.embedding for d in resp.data]
