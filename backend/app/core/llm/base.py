from collections.abc import AsyncIterator
from dataclasses import dataclass


@dataclass
class LLMMessage:
    role: str
    content: str


class BaseLLMProvider:
    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        raise NotImplementedError

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        text = await self.complete(system, messages)
        yield text
