import io
import uuid
from typing import Any

from minio import Minio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import Collection, Document, DocumentStatus, Tenant


def get_minio_client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


async def ensure_bucket() -> None:
    import asyncio

    def _ensure():
        client = get_minio_client()
        if not client.bucket_exists(settings.minio_bucket):
            client.make_bucket(settings.minio_bucket)

    await asyncio.to_thread(_ensure)


async def upload_document_bytes(
    db: AsyncSession,
    collection_id: uuid.UUID,
    tenant_id: uuid.UUID,
    filename: str,
    data: bytes,
    metadata: dict[str, Any] | None = None,
) -> Document:
    doc_id = uuid.uuid4()
    path = f"{tenant_id}/{collection_id}/{doc_id}/{filename}"
    client = get_minio_client()
    client.put_object(
        settings.minio_bucket,
        path,
        io.BytesIO(data),
        length=len(data),
        content_type="application/octet-stream",
    )
    doc = Document(
        id=doc_id,
        collection_id=collection_id,
        filename=filename,
        minio_path=path,
        status=DocumentStatus.pending,
        metadata_=metadata or {},
    )
    db.add(doc)
    await db.flush()
    return doc


async def get_default_tenant(db: AsyncSession) -> Tenant:
    result = await db.execute(select(Tenant).limit(1))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise RuntimeError("No tenant seeded. Run seed script.")
    return tenant


async def get_default_collection(db: AsyncSession, tenant_id: uuid.UUID) -> Collection:
    result = await db.execute(
        select(Collection).where(Collection.tenant_id == tenant_id, Collection.slug == "default")
    )
    col = result.scalar_one_or_none()
    if not col:
        raise RuntimeError("No default collection. Run seed script.")
    return col
