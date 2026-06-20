"""Direct LLM connectivity checks (no RAG / embeddings). Used by the setup wizard."""

import httpx

from app.config import settings


DEFAULT_MODELS = {
    "ollama": "llama3.2",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-haiku-20241022",
    "gemini": "gemini-2.0-flash",
    "openai_compatible": "gpt-4o-mini",
}


async def probe_llm(
    provider: str,
    message: str,
    api_key: str | None = None,
    model: str | None = None,
    base_url: str | None = None,
) -> dict:
    provider = provider if provider != "custom" else "openai_compatible"
    model = model or DEFAULT_MODELS.get(provider) or settings.llm_model

    try:
        if provider == "openai":
            key = api_key or settings.openai_api_key or settings.llm_api_key
            if not key:
                return {"ok": False, "error": "OpenAI API key is required"}
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=key)
            resp = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": message}],
                max_tokens=64,
            )
            content = resp.choices[0].message.content or ""
            return {"ok": True, "content": content, "provider": provider, "model": model}

        if provider == "anthropic":
            key = api_key or settings.anthropic_api_key
            if not key:
                return {"ok": False, "error": "Anthropic API key is required"}
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=key)
            resp = await client.messages.create(
                model=model,
                max_tokens=64,
                messages=[{"role": "user", "content": message}],
            )
            content = resp.content[0].text if resp.content else ""
            return {"ok": True, "content": content, "provider": provider, "model": model}

        if provider == "gemini":
            key = api_key or settings.google_api_key
            if not key:
                return {"ok": False, "error": "Google API key is required"}
            import google.generativeai as genai

            genai.configure(api_key=key)
            gemini_model = genai.GenerativeModel(model)
            resp = await gemini_model.generate_content_async(message)
            return {
                "ok": True,
                "content": resp.text or "",
                "provider": provider,
                "model": model,
            }

        if provider == "openai_compatible":
            url = base_url or settings.llm_base_url
            key = api_key or settings.llm_api_key
            if not url:
                return {"ok": False, "error": "Base URL is required for custom / OpenAI-compatible APIs"}
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=key or "not-needed", base_url=url)
            resp = await client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": message}],
                max_tokens=64,
            )
            content = resp.choices[0].message.content or ""
            return {"ok": True, "content": content, "provider": provider, "model": model}

        if provider == "ollama":
            base = settings.ollama_base_url.rstrip("/")
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{base}/api/chat",
                    json={"model": model, "messages": [{"role": "user", "content": message}], "stream": False},
                )
                resp.raise_for_status()
                content = resp.json().get("message", {}).get("content", "")
            return {"ok": True, "content": content, "provider": provider, "model": model}

        return {"ok": False, "error": f"Unknown provider: {provider}"}
    except Exception as e:
        return {"ok": False, "error": str(e), "provider": provider, "model": model}


def openai_env_hint() -> list[str]:
    return [
        "LLM_PROVIDER=openai",
        "LLM_MODEL=gpt-4o-mini",
        "OPENAI_API_KEY=sk-your-key-here",
        "EMBEDDING_PROVIDER=openai",
        "EMBEDDING_MODEL=text-embedding-3-small",
        "EMBEDDING_DIMENSION=768",
    ]
