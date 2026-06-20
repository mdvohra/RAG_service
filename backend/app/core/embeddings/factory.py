from app.core.embeddings.base import BaseEmbeddingProvider


def get_embedding_provider() -> BaseEmbeddingProvider:
    from app.config import settings
    from app.core.embeddings.gemini import GeminiEmbeddingProvider
    from app.core.embeddings.ollama import OllamaEmbeddingProvider
    from app.core.embeddings.openai import OpenAIEmbeddingProvider
    from app.core.embeddings.sentence_transformers import SentenceTransformersProvider

    providers = {
        "ollama": OllamaEmbeddingProvider,
        "openai": OpenAIEmbeddingProvider,
        "gemini": GeminiEmbeddingProvider,
        "sentence-transformers": SentenceTransformersProvider,
    }
    cls = providers.get(settings.embedding_provider)
    if not cls:
        raise ValueError(f"Unknown embedding provider: {settings.embedding_provider}")
    return cls()
