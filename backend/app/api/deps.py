import uuid

from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import verify_api_key
from app.core.site import validate_widget_origin
from app.database import get_db
from app.models import Tenant


async def get_tenant_from_api_key(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing API key")
    api_key = authorization.removeprefix("Bearer ").strip()
    if settings.deployment_mode == "single_tenant" and api_key == settings.api_key:
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalar_one_or_none()
        if tenant:
            return tenant
    result = await db.execute(select(Tenant))
    for tenant in result.scalars():
        if verify_api_key(api_key, tenant.api_key_hash):
            return tenant
    raise HTTPException(status_code=401, detail="Invalid API key")


async def get_tenant_from_widget(
    request: Request,
    x_widget_key: str | None = Header(None, alias="X-Widget-Key"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    validate_widget_origin(request)
    key = x_widget_key or settings.widget_key
    if settings.deployment_mode == "single_tenant" and key == settings.widget_key:
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalar_one_or_none()
        if tenant:
            return tenant
    result = await db.execute(select(Tenant).where(Tenant.widget_key == key))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid widget key")
    return tenant


TenantDep = Depends(get_tenant_from_api_key)
WidgetTenantDep = Depends(get_tenant_from_widget)
