from openai import AsyncAzureOpenAI

from app.config import settings
from app.core.llm.openai import OpenAIProvider


class AzureOpenAIProvider(OpenAIProvider):
    def __init__(self) -> None:
        self.client = AsyncAzureOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version="2024-02-15-preview",
        )
        self.model = settings.azure_openai_deployment or settings.llm_model
