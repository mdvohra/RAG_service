import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.deps import TenantDep, WidgetTenantDep, get_tenant_from_widget
from app.config import settings
from app.core.conversation import (
    export_conversation_csv,
    export_conversation_json,
    get_or_create_conversation,
    load_history,
)
from app.core.persona import get_widget_config
from app.core.site import validate_widget_origin
from app.database import get_db
from app.models import Collection, Conversation, Message, Tenant
from app.services.rag_service import RAGService

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    collection_id: str | None = None
    collection_slug: str | None = "default"
    user_id: str | None = None
    user_email: str | None = None
    page_url: str | None = None
    filters: dict[str, Any] = Field(default_factory=dict)
    stream: bool = True


class SessionCreate(BaseModel):
    user_id: str | None = None
    user_email: str | None = None
    page_url: str | None = None


@router.post("/chat/sessions")
async def create_session(
    body: SessionCreate,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    session_id = str(uuid.uuid4())
    conv = await get_or_create_conversation(
        db, tenant.id, session_id, body.user_id, body.user_email, body.page_url
    )
    return {"session_id": session_id, "conversation_id": str(conv.id)}


@router.get("/chat/sessions/{session_id}")
async def get_session(
    session_id: str,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.tenant_id == tenant.id, Conversation.session_id == session_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Session not found")
    history = await load_history(db, conv.id)
    return {"session_id": session_id, "messages": history}


async def _resolve_collection(db: AsyncSession, tenant_id: uuid.UUID, collection_id: str | None, slug: str | None):
    if collection_id:
        result = await db.execute(
            select(Collection).where(Collection.id == uuid.UUID(collection_id), Collection.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()
    if slug:
        result = await db.execute(
            select(Collection).where(Collection.slug == slug, Collection.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()
    return None


async def _chat_handler(body: ChatRequest, tenant: Tenant, db: AsyncSession):
    session_id = body.session_id or str(uuid.uuid4())
    conv = await get_or_create_conversation(
        db, tenant.id, session_id, body.user_id, body.user_email, body.page_url
    )
    col = await _resolve_collection(db, tenant.id, body.collection_id, body.collection_slug)
    rag = RAGService(db)

    async def event_generator():
        async for event in rag.chat_stream(
            conv,
            body.message,
            collection_slug=col.slug if col else body.collection_slug,
            collection_id=str(col.id) if col else None,
            filters=body.filters,
        ):
            yield {"event": event["type"], "data": json.dumps(event)}

    return EventSourceResponse(event_generator())


@router.post("/chat")
async def chat(body: ChatRequest, tenant: Tenant = TenantDep, db: AsyncSession = Depends(get_db)):
    if body.stream:
        return await _chat_handler(body, tenant, db)

    session_id = body.session_id or str(uuid.uuid4())
    conv = await get_or_create_conversation(
        db, tenant.id, session_id, body.user_id, body.user_email, body.page_url
    )
    col = await _resolve_collection(db, tenant.id, body.collection_id, body.collection_slug)
    rag = RAGService(db)
    content = ""
    confidence = 0.0
    sources = []
    async for event in rag.chat_stream(
        conv,
        body.message,
        collection_slug=col.slug if col else body.collection_slug,
        collection_id=str(col.id) if col else None,
        filters=body.filters,
    ):
        if event["type"] == "token":
            content += event["content"]
        elif event["type"] == "fallback":
            content = event["content"]
        elif event["type"] == "confidence":
            confidence = event["confidence"]
        elif event["type"] == "sources":
            sources = event["sources"]
        elif event["type"] == "done":
            sources = event.get("sources", sources)
    return {
        "session_id": session_id,
        "content": content,
        "confidence": confidence,
        "sources": sources,
        "site_url": settings.site_url,
    }


@router.post("/widget/chat")
async def widget_chat(
    body: ChatRequest,
    tenant: Tenant = WidgetTenantDep,
    db: AsyncSession = Depends(get_db),
):
    return await _chat_handler(body, tenant, db)


@router.get("/widget/config")
async def widget_config(request: Request, tenant: Tenant = WidgetTenantDep):
    validate_widget_origin(request)
    config = get_widget_config()
    config["widgetKey"] = tenant.widget_key
    return config


@router.get("/conversations")
async def list_conversations(
    user_id: str | None = None,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    q = select(Conversation).where(Conversation.tenant_id == tenant.id)
    if user_id:
        q = q.where(Conversation.user_id == user_id)
    result = await db.execute(q.order_by(Conversation.updated_at.desc()).limit(100))
    convs = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "session_id": c.session_id,
            "user_id": c.user_id,
            "user_email": c.user_email,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in convs
    ]


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: uuid.UUID,
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return {
        "conversation": {
            "id": str(conv.id),
            "session_id": conv.session_id,
            "user_id": conv.user_id,
            "summary": conv.summary,
        },
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "sources": m.sources,
                "confidence_score": m.confidence_score,
            }
            for m in messages
        ],
    }


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: uuid.UUID,
    format: str = Query("json"),
    tenant: Tenant = TenantDep,
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.tenant_id != tenant.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    messages = result.scalars().all()
    if format == "csv":
        from fastapi.responses import PlainTextResponse

        return PlainTextResponse(export_conversation_csv(conv, messages), media_type="text/csv")
    return json.loads(export_conversation_json(conv, messages))
