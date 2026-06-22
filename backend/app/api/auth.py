import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUserDep
from app.config import settings
from app.core.auth import hash_api_key, hash_password, verify_password
from app.core.jwt_tokens import create_access_token
from app.core.tenant_config import tenant_onboarding_complete
from app.database import get_db
from app.models import Collection, Tenant, User

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    org_name: str = Field(min_length=1, max_length=255)
    site_url: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    api_key: str | None = None
    widget_key: str | None = None
    tenant_id: str
    email: str
    onboarding_complete: bool


class MeResponse(BaseModel):
    email: str
    tenant_id: str
    tenant_name: str
    site_url: str | None
    widget_key: str
    onboarding_complete: bool


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    if settings.deployment_mode != "multi_tenant":
        raise HTTPException(status_code=400, detail="Signup only available in multi_tenant mode")

    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    api_key = f"rag_{secrets.token_urlsafe(24)}"
    widget_key = f"wk_{secrets.token_urlsafe(16)}"
    tenant = Tenant(
        name=body.org_name,
        api_key_hash=hash_api_key(api_key),
        widget_key=widget_key,
        site_url=body.site_url,
        settings={"onboarding_complete": False},
    )
    db.add(tenant)
    await db.flush()

    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        tenant_id=tenant.id,
    )
    db.add(user)

    collection = Collection(tenant_id=tenant.id, name="Default", slug="default")
    db.add(collection)
    await db.flush()

    token = create_access_token(str(user.id), str(tenant.id))
    return AuthResponse(
        access_token=token,
        api_key=api_key,
        widget_key=widget_key,
        tenant_id=str(tenant.id),
        email=user.email,
        onboarding_complete=False,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    if settings.deployment_mode != "multi_tenant":
        raise HTTPException(status_code=400, detail="Login only available in multi_tenant mode")

    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    tenant = await db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=500, detail="Tenant not found")

    token = create_access_token(str(user.id), str(tenant.id))
    return AuthResponse(
        access_token=token,
        tenant_id=str(tenant.id),
        email=user.email,
        onboarding_complete=tenant_onboarding_complete(tenant),
    )


@router.get("/me", response_model=MeResponse)
async def me(user: User = CurrentUserDep, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(Tenant, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=500, detail="Tenant not found")
    return MeResponse(
        email=user.email,
        tenant_id=str(tenant.id),
        tenant_name=tenant.name,
        site_url=tenant.site_url,
        widget_key=tenant.widget_key,
        onboarding_complete=tenant_onboarding_complete(tenant),
    )
