from openai import AsyncOpenAI

from app.config import settings
from app.core.llm.openai import OpenAIProvider


class OpenAICompatibleProvider(OpenAIProvider):
    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=settings.llm_api_key or "not-needed",
            base_url=settings.llm_base_url,
        )
        self.model = settings.llm_model
