import httpx

from app.config import settings
from app.core.llm.anthropic import AnthropicProvider
from app.core.llm.azure_openai import AzureOpenAIProvider
from app.core.llm.base import BaseLLMProvider
from app.core.llm.gemini import GeminiProvider
from app.core.llm.ollama import OllamaProvider
from app.core.llm.openai import OpenAIProvider
from app.core.llm.openai_compatible import OpenAICompatibleProvider


def get_llm_provider(collection_slug: str | None = None) -> BaseLLMProvider:
    provider = settings.llm_provider
    if collection_slug:
        provider = settings.collection_llm_provider(collection_slug) or provider

    providers = {
        "ollama": OllamaProvider,
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "gemini": GeminiProvider,
        "azure_openai": AzureOpenAIProvider,
        "openai_compatible": OpenAICompatibleProvider,
    }
    cls = providers.get(provider)
    if not cls:
        raise ValueError(f"Unknown LLM provider: {provider}")
    return cls()


def mask_key(key: str | None) -> str:
    if not key:
        return "not set"
    if len(key) <= 8:
        return "***"
    return f"{key[:4]}...{key[-4:]}"


def get_llm_config_status() -> dict:
    return {
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "embedding_provider": settings.embedding_provider,
        "embedding_model": settings.embedding_model,
        "keys": {
            "openai_api_key": mask_key(settings.openai_api_key),
            "anthropic_api_key": mask_key(settings.anthropic_api_key),
            "google_api_key": mask_key(settings.google_api_key),
            "azure_openai_api_key": mask_key(settings.azure_openai_api_key),
            "llm_api_key": mask_key(settings.llm_api_key),
        },
        "supported_providers": [
            "ollama",
            "openai",
            "anthropic",
            "gemini",
            "azure_openai",
            "openai_compatible",
        ],
    }


async def check_llm_health() -> dict:
    status = {"provider": settings.llm_provider, "ok": False, "detail": ""}
    try:
        if settings.llm_provider == "ollama":
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
                resp.raise_for_status()
                models = [m["name"] for m in resp.json().get("models", [])]
                base = settings.llm_model.split(":")[0]
                status["ok"] = any(base in m for m in models) or len(models) > 0
                status["detail"] = f"models: {models[:5]}"
        else:
            status["ok"] = True
            status["detail"] = "cloud provider configured"
    except Exception as e:
        status["detail"] = str(e)
    return status
