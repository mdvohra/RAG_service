import google.generativeai as genai

from app.config import settings
from app.core.embeddings.base import BaseEmbeddingProvider


class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        genai.configure(api_key=settings.google_api_key)
        vectors = []
        for text in texts:
            result = genai.embed_content(model=f"models/{settings.embedding_model}", content=text)
            vectors.append(result["embedding"])
        return vectors
