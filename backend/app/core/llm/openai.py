from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from app.config import settings
from app.core.llm.base import BaseLLMProvider, LLMMessage


class OpenAIProvider(BaseLLMProvider):
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key or settings.llm_api_key)
        self.model = settings.llm_model

    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system}]
            + [{"role": m.role, "content": m.content} for m in messages],
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )
        return resp.choices[0].message.content or ""

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system}]
            + [{"role": m.role, "content": m.content} for m in messages],
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            stream=True,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
