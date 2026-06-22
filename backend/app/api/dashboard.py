import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DashboardTenantDep, CurrentUserDep
from app.core.llm.factory import check_llm_health
from app.core.llm.probe import probe_llm
from app.core.tenant_config import (
    get_widget_config_for_tenant,
    public_settings_view,
    settings_to_store,
    tenant_onboarding_complete,
)
from app.database import get_db
from app.models import Collection, Document, DocumentStatus, Tenant, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class SettingsUpdate(BaseModel):
    site_url: str | None = None
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    embedding_provider: str | None = None
    embedding_model: str | None = None
    embedding_api_key: str | None = None
    widget_title: str | None = None
    widget_primary_color: str | None = None
    widget_position: str | None = None
    welcome_message: str | None = None
    starter_questions: list[str] | None = None
    company_context: str | None = None
    general_chat_enabled: bool | None = None
    onboarding_complete: bool | None = None


class LLMTestBody(BaseModel):
    provider: str = "openai"
    api_key: str | None = None
    model: str | None = None
    base_url: str | None = None
    message: str = "Say hello in one short sentence."


@router.get("/overview")
async def get_overview(tenant: Tenant = DashboardTenantDep, db: AsyncSession = Depends(get_db)):
    col_result = await db.execute(
        select(Collection.id).where(Collection.tenant_id == tenant.id).limit(1)
    )
    col_id = col_result.scalar_one_or_none()
    docs_total = 0
    docs_ready = 0
    if col_id:
        total_q = await db.execute(
            select(func.count()).select_from(Document).where(Document.collection_id == col_id)
        )
        docs_total = total_q.scalar() or 0
        ready_q = await db.execute(
            select(func.count()).select_from(Document).where(
                Document.collection_id == col_id,
                Document.status == DocumentStatus.ready,
            )
        )
        docs_ready = ready_q.scalar() or 0
    llm_health = await check_llm_health()
    return {
        "tenant_name": tenant.name,
        "site_url": tenant.site_url,
        "widget_key": tenant.widget_key,
        "onboarding_complete": tenant_onboarding_complete(tenant),
        "documents_total": docs_total,
        "documents_ready": docs_ready,
        "health": {
            "api": True,
            "llm": llm_health.get("ok", False),
        },
    }


@router.get("/settings")
async def get_settings(tenant: Tenant = DashboardTenantDep):
    return public_settings_view(tenant)


@router.put("/settings")
async def update_settings(
    body: SettingsUpdate,
    tenant: Tenant = DashboardTenantDep,
    db: AsyncSession = Depends(get_db),
):
    data = body.model_dump(exclude_unset=True)
    if "site_url" in data:
        tenant.site_url = data.pop("site_url")
    stored = settings_to_store(data)
    tenant.settings = {**(tenant.settings or {}), **stored}
    await db.flush()
    return public_settings_view(tenant)


@router.post("/settings/llm/test")
async def test_llm_settings(body: LLMTestBody, tenant: Tenant = DashboardTenantDep):
    from app.core.tenant_config import tenant_llm_api_key, tenant_llm_model

    api_key = body.api_key or tenant_llm_api_key(tenant)
    model = body.model or tenant_llm_model(tenant)
    return await probe_llm(
        provider=body.provider,
        message=body.message,
        api_key=api_key,
        model=model,
        base_url=body.base_url,
    )


@router.get("/keys")
async def get_keys(tenant: Tenant = DashboardTenantDep, user: User = CurrentUserDep):
    api_public = get_widget_config_for_tenant(tenant)
    return {
        "widget_key": tenant.widget_key,
        "api_url_note": "API key is shown once at signup; use dashboard JWT for management.",
        "widget_config": api_public,
        "email": user.email,
    }


@router.get("/widget-config")
async def widget_config_preview(tenant: Tenant = DashboardTenantDep):
    return get_widget_config_for_tenant(tenant)
