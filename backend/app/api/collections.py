import json
import uuid
from typing import Any

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TenantDep, get_tenant_from_api_key
from app.config import settings
from app.database import get_db
from app.models import Collection, Document, Tenant
from app.services.storage import upload_document_bytes

router = APIRouter(prefix="/collections", tags=["collections"])


class CollectionCreate(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None


class CollectionOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: uuid.UUID
    filename: str
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    error_message: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}


def document_to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        filename=doc.filename,
        status=doc.status.value,
        metadata=doc.metadata_,
        error_message=doc.error_message,
        created_at=doc.created_at.isoformat() if doc.created_at else None,
        updated_at=doc.updated_at.isoformat() if doc.updated_at else None,
    )


@router.post("", response_model=CollectionOut)
async def create_collection(
    body: CollectionCreate,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    slug = body.slug or body.name.lower().replace(" ", "-")
    col = Collection(tenant_id=tenant.id, name=body.name, slug=slug, description=body.description)
    db.add(col)
    await db.flush()
    return col


@router.get("", response_model=list[CollectionOut])
async def list_collections(tenant: Tenant = TenantDep, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Collection).where(Collection.tenant_id == tenant.id))
    return result.scalars().all()


@router.post("/{collection_id}/documents", response_model=DocumentOut)
async def upload_document(
    collection_id: uuid.UUID,
    file: UploadFile = File(...),
    metadata: str = Form("{}"),
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id, Collection.tenant_id == tenant.id)
    )
    col = result.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")

    data = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb}MB")

    meta = json.loads(metadata) if metadata else {}
    doc = await upload_document_bytes(db, col.id, tenant.id, file.filename or "upload", data, meta)

    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await redis.enqueue_job("enqueue_document", str(doc.id))
    await redis.close()

    return document_to_out(doc)


@router.get("/{collection_id}/documents", response_model=list[DocumentOut])
async def list_documents(
    collection_id: uuid.UUID,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .join(Collection)
        .where(Collection.id == collection_id, Collection.tenant_id == tenant.id)
        .order_by(Document.created_at.desc())
    )
    return [document_to_out(d) for d in result.scalars().all()]
