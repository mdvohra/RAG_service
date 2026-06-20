import uuid

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TenantDep
from app.config import settings
from app.database import get_db
from app.models import Collection, Document, DocumentStatus, Tenant
from app.services.storage import get_minio_client

router = APIRouter(prefix="/documents", tags=["documents"])


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .join(Collection)
        .where(Document.id == document_id, Collection.tenant_id == tenant.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        client = get_minio_client()
        client.remove_object(settings.minio_bucket, doc.minio_path)
    except Exception:
        pass

    await db.delete(doc)
    return {"deleted": True}


@router.post("/{document_id}/reindex")
async def reindex_document(
    document_id: uuid.UUID,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .join(Collection)
        .where(Document.id == document_id, Collection.tenant_id == tenant.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = DocumentStatus.pending
    await db.flush()

    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    await redis.enqueue_job("enqueue_document", str(doc.id))
    await redis.close()
    return {"status": "queued"}
