import uuid

from fastapi import Depends, Header, HTTPException, Request
from jwt import PyJWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import verify_api_key
from app.core.jwt_tokens import decode_access_token
from app.core.site import validate_widget_origin
from app.database import get_db
from app.models import Tenant, User


async def get_tenant_from_api_key(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing API key")
    token = authorization.removeprefix("Bearer ").strip()

    if settings.deployment_mode == "single_tenant" and token == settings.api_key:
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalar_one_or_none()
        if tenant:
            return tenant

    result = await db.execute(select(Tenant))
    for tenant in result.scalars():
        if verify_api_key(token, tenant.api_key_hash):
            return tenant

    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
        user = await db.get(User, user_id)
        if user:
            tenant = await db.get(Tenant, user.tenant_id)
            if tenant:
                return tenant
    except (PyJWTError, KeyError, ValueError):
        pass

    raise HTTPException(status_code=401, detail="Invalid API key or token")


async def get_current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_tenant_from_user(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    tenant = await db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=500, detail="Tenant not found")
    return tenant


async def get_tenant_from_widget(
    request: Request,
    x_widget_key: str | None = Header(None, alias="X-Widget-Key"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    key = x_widget_key or settings.widget_key
    tenant: Tenant | None = None
    if settings.deployment_mode == "single_tenant" and key == settings.widget_key:
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalar_one_or_none()
    else:
        result = await db.execute(select(Tenant).where(Tenant.widget_key == key))
        tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid widget key")
    validate_widget_origin(request, tenant)
    return tenant


TenantDep = Depends(get_tenant_from_api_key)
WidgetTenantDep = Depends(get_tenant_from_widget)
CurrentUserDep = Depends(get_current_user)
DashboardTenantDep = Depends(get_tenant_from_user)
