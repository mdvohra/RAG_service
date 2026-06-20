from collections.abc import AsyncIterator

import google.generativeai as genai

from app.config import settings
from app.core.llm.base import BaseLLMProvider, LLMMessage


class GeminiProvider(BaseLLMProvider):
    def __init__(self) -> None:
        genai.configure(api_key=settings.google_api_key)
        self.model = genai.GenerativeModel(settings.llm_model)

    def _build_prompt(self, system: str, messages: list[LLMMessage]) -> str:
        parts = [f"System: {system}"]
        for m in messages:
            parts.append(f"{m.role}: {m.content}")
        parts.append("assistant:")
        return "\n".join(parts)

    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        prompt = self._build_prompt(system, messages)
        resp = await self.model.generate_content_async(prompt)
        return resp.text or ""

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        prompt = self._build_prompt(system, messages)
        resp = await self.model.generate_content_async(prompt, stream=True)
        async for chunk in resp:
            if chunk.text:
                yield chunk.text
