import json
from collections.abc import AsyncIterator

import httpx

from app.config import settings
from app.core.llm.base import BaseLLMProvider, LLMMessage


class OllamaProvider(BaseLLMProvider):
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.llm_model

    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}]
            + [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"temperature": settings.llm_temperature, "num_predict": settings.llm_max_tokens},
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": system}]
            + [{"role": m.role, "content": m.content} for m in messages],
            "stream": True,
            "options": {"temperature": settings.llm_temperature, "num_predict": settings.llm_max_tokens},
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if chunk := data.get("message", {}).get("content"):
                        yield chunk
