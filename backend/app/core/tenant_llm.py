"""LLM provider built from tenant-specific credentials."""

from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from app.config import settings
from app.core.llm.base import BaseLLMProvider, LLMMessage
from app.core.tenant_config import (
    tenant_llm_api_key,
    tenant_llm_base_url,
    tenant_llm_model,
    tenant_llm_provider,
)
from app.models import Tenant


class TenantAwareLLMProvider(BaseLLMProvider):
    def __init__(self, tenant: Tenant | None, collection_slug: str | None = None) -> None:
        self.tenant = tenant
        self.provider = tenant_llm_provider(tenant)
        if collection_slug and tenant is None:
            override = settings.collection_llm_provider(collection_slug)
            if override:
                self.provider = override
        self.model = tenant_llm_model(tenant)
        if collection_slug and tenant is None:
            override = settings.collection_llm_model(collection_slug)
            if override:
                self.model = override

    async def complete(self, system: str, messages: list[LLMMessage]) -> str:
        from app.core.llm.factory import get_llm_provider

        if not self.tenant or not self.tenant.settings.get("llm_api_key_enc"):
            llm = get_llm_provider()
            return await llm.complete(system, messages)

        provider = self.provider
        if provider in ("openai", "openai_compatible", "custom"):
            key = tenant_llm_api_key(self.tenant, provider)
            base = tenant_llm_base_url(self.tenant)
            client = AsyncOpenAI(api_key=key, base_url=base) if base else AsyncOpenAI(api_key=key)
            resp = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system}]
                + [{"role": m.role, "content": m.content} for m in messages],
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
            )
            return resp.choices[0].message.content or ""

        llm = get_llm_provider()
        return await llm.complete(system, messages)

    async def stream(self, system: str, messages: list[LLMMessage]) -> AsyncIterator[str]:
        from app.core.llm.factory import get_llm_provider

        if not self.tenant or not self.tenant.settings.get("llm_api_key_enc"):
            llm = get_llm_provider()
            async for token in llm.stream(system, messages):
                yield token
            return

        provider = self.provider
        if provider in ("openai", "openai_compatible", "custom"):
            key = tenant_llm_api_key(self.tenant, provider)
            base = tenant_llm_base_url(self.tenant)
            client = AsyncOpenAI(api_key=key, base_url=base) if base else AsyncOpenAI(api_key=key)
            stream = await client.chat.completions.create(
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
            return

        llm = get_llm_provider()
        async for token in llm.stream(system, messages):
            yield token


def get_llm_for_tenant(tenant: Tenant | None, collection_slug: str | None = None) -> BaseLLMProvider:
    return TenantAwareLLMProvider(tenant, collection_slug)
