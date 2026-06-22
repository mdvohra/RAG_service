import secrets
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TenantDep
from app.config import settings
from app.core.auth import hash_api_key, verify_api_key
from app.database import get_db
from app.models import Tenant

router = APIRouter(prefix="/admin", tags=["admin"])


class TenantCreate(BaseModel):
    name: str
    site_url: str | None = None


class TenantOut(BaseModel):
    id: uuid.UUID
    name: str
    widget_key: str
    api_key: str
    site_url: str | None

    model_config = {"from_attributes": True}


async def require_super_admin(authorization: str | None = Header(None)) -> None:
    if not settings.super_admin_api_key:
        raise HTTPException(status_code=403, detail="Super admin API key not configured")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.super_admin_api_key:
        raise HTTPException(status_code=403, detail="Super admin access required")


@router.post("/tenants", response_model=TenantOut, dependencies=[Depends(require_super_admin)])
async def create_tenant(body: TenantCreate, db: AsyncSession = Depends(get_db)):
    if settings.deployment_mode != "multi_tenant":
        raise HTTPException(status_code=400, detail="Multi-tenant mode is not enabled")

    api_key = f"rag_{secrets.token_urlsafe(24)}"
    widget_key = f"wk_{secrets.token_urlsafe(16)}"
    tenant = Tenant(
        name=body.name,
        api_key_hash=hash_api_key(api_key),
        widget_key=widget_key,
        site_url=body.site_url,
        settings={},
    )
    db.add(tenant)
    await db.flush()
    return TenantOut(
        id=tenant.id,
        name=tenant.name,
        widget_key=widget_key,
        api_key=api_key,
        site_url=tenant.site_url,
    )


@router.get("/tenants", dependencies=[Depends(require_super_admin)])
async def list_tenants(db: AsyncSession = Depends(get_db)):
    if settings.deployment_mode != "multi_tenant":
        raise HTTPException(status_code=400, detail="Multi-tenant mode is not enabled")
    result = await db.execute(select(Tenant))
    tenants = result.scalars().all()
    return [
        {"id": str(t.id), "name": t.name, "site_url": t.site_url, "widget_key": t.widget_key}
        for t in tenants
    ]
