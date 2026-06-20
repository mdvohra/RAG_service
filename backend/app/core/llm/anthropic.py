from collections.abc import AsyncIterator

from anthropic import AsyncAnthropic

from app.config import settings
from app.core.llm.base import BaseLLMProvider, LLMMessage


class AnthropicProvider(BaseLLMProvider):
    def __init__(self) -> None:
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.llm_model

    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        resp = await self.client.messages.create(
            model=self.model,
            max_tokens=settings.llm_max_tokens,
            system=system,
            messages=[{"role": m.role, "content": m.content} for m in messages if m.role != "system"],
        )
        return resp.content[0].text if resp.content else ""

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=settings.llm_max_tokens,
            system=system,
            messages=[{"role": m.role, "content": m.content} for m in messages if m.role != "system"],
        ) as stream:
            async for text in stream.text_stream:
                yield text
