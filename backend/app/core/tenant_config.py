"""Per-tenant runtime configuration."""

from typing import Any

from app.config import settings
from app.core.encryption import decrypt_value
from app.models import Tenant


def _s(tenant: Tenant | None, key: str, default: Any = None) -> Any:
    if tenant and tenant.settings and key in tenant.settings:
        return tenant.settings[key]
    return default


def tenant_site_url(tenant: Tenant | None) -> str:
    if tenant and tenant.site_url:
        return tenant.site_url
    return settings.site_url


def tenant_llm_provider(tenant: Tenant | None) -> str:
    return _s(tenant, "llm_provider", settings.llm_provider)


def tenant_llm_model(tenant: Tenant | None) -> str:
    return _s(tenant, "llm_model", settings.llm_model)


def tenant_embedding_provider(tenant: Tenant | None) -> str:
    return _s(tenant, "embedding_provider", settings.embedding_provider)


def tenant_embedding_model(tenant: Tenant | None) -> str:
    return _s(tenant, "embedding_model", settings.embedding_model)


def tenant_llm_api_key(tenant: Tenant | None, provider: str | None = None) -> str | None:
    provider = provider or tenant_llm_provider(tenant)
    enc = _s(tenant, "llm_api_key_enc")
    if enc:
        return decrypt_value(enc)
    if provider == "openai":
        return settings.openai_api_key or settings.llm_api_key
    if provider == "anthropic":
        return settings.anthropic_api_key
    if provider == "gemini":
        return settings.google_api_key
    return settings.llm_api_key


def tenant_llm_base_url(tenant: Tenant | None) -> str | None:
    return _s(tenant, "llm_base_url", settings.llm_base_url)


def tenant_embedding_api_key(tenant: Tenant | None) -> str | None:
    enc = _s(tenant, "embedding_api_key_enc")
    if enc:
        return decrypt_value(enc)
    provider = tenant_embedding_provider(tenant)
    if provider == "openai":
        return settings.openai_api_key or settings.llm_api_key
    if provider == "gemini":
        return settings.google_api_key
    return settings.llm_api_key


def tenant_general_chat_enabled(tenant: Tenant | None) -> bool:
    val = _s(tenant, "general_chat_enabled")
    return val if val is not None else settings.general_chat_enabled


def tenant_company_context(tenant: Tenant | None) -> str:
    return _s(tenant, "company_context", settings.company_context) or ""


def tenant_onboarding_complete(tenant: Tenant | None) -> bool:
    return bool(_s(tenant, "onboarding_complete", False))


def get_widget_config_for_tenant(tenant: Tenant) -> dict:
    return {
        "title": _s(tenant, "widget_title", settings.widget_title),
        "primaryColor": _s(tenant, "widget_primary_color", settings.widget_primary_color),
        "position": _s(tenant, "widget_position", settings.widget_position),
        "starterQuestions": _s(tenant, "starter_questions", settings.starter_questions),
        "welcomeMessage": _s(tenant, "welcome_message", settings.welcome_message),
        "siteUrl": tenant_site_url(tenant),
        "widgetKey": tenant.widget_key,
        "poweredBy": "RAG4All",
        "showPoweredBy": _s(tenant, "show_powered_by", True),
    }


def settings_to_store(body: dict) -> dict:
    """Map dashboard PUT body to tenant.settings JSON (encrypt secrets)."""
    from app.core.encryption import encrypt_value

    out: dict[str, Any] = {}
    for key in (
        "llm_provider",
        "llm_model",
        "llm_base_url",
        "embedding_provider",
        "embedding_model",
        "widget_title",
        "widget_primary_color",
        "widget_position",
        "welcome_message",
        "starter_questions",
        "company_context",
        "general_chat_enabled",
        "onboarding_complete",
    ):
        if key in body and body[key] is not None:
            out[key] = body[key]
    if body.get("llm_api_key"):
        out["llm_api_key_enc"] = encrypt_value(body["llm_api_key"])
    if body.get("embedding_api_key"):
        out["embedding_api_key_enc"] = encrypt_value(body["embedding_api_key"])
    return out


def public_settings_view(tenant: Tenant) -> dict:
    return {
        "name": tenant.name,
        "site_url": tenant.site_url,
        "llm_provider": tenant_llm_provider(tenant),
        "llm_model": tenant_llm_model(tenant),
        "llm_base_url": tenant_llm_base_url(tenant),
        "embedding_provider": tenant_embedding_provider(tenant),
        "embedding_model": tenant_embedding_model(tenant),
        "widget_title": _s(tenant, "widget_title", settings.widget_title),
        "widget_primary_color": _s(tenant, "widget_primary_color", settings.widget_primary_color),
        "widget_position": _s(tenant, "widget_position", settings.widget_position),
        "welcome_message": _s(tenant, "welcome_message", settings.welcome_message),
        "starter_questions": _s(tenant, "starter_questions", settings.starter_questions),
        "company_context": tenant_company_context(tenant),
        "general_chat_enabled": tenant_general_chat_enabled(tenant),
        "onboarding_complete": tenant_onboarding_complete(tenant),
        "has_llm_api_key": bool(_s(tenant, "llm_api_key_enc")),
        "has_embedding_api_key": bool(_s(tenant, "embedding_api_key_enc")),
    }
