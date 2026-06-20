import csv
import io
import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AuditLog, Conversation, Message


async def get_or_create_conversation(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    session_id: str,
    user_id: str | None = None,
    user_email: str | None = None,
    page_url: str | None = None,
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.tenant_id == tenant_id,
            Conversation.session_id == session_id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv:
        if user_id:
            conv.user_id = user_id
        if user_email:
            conv.user_email = user_email
        if page_url:
            conv.page_url = page_url
        return conv

    conv = Conversation(
        tenant_id=tenant_id,
        session_id=session_id,
        user_id=user_id,
        user_email=user_email,
        page_url=page_url,
    )
    db.add(conv)
    await db.flush()
    if settings.audit_log_enabled:
        db.add(
            AuditLog(
                conversation_id=conv.id,
                event_type="chat.started",
                payload={"session_id": session_id, "user_id": user_id},
            )
        )
    return conv


async def load_history(db: AsyncSession, conversation_id: uuid.UUID) -> list[dict[str, str]]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(settings.max_history_messages)
    )
    messages = list(reversed(result.scalars().all()))
    return [{"role": m.role, "content": m.content} for m in messages]


async def save_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    role: str,
    content: str,
    sources: list[Any] | None = None,
    confidence_score: float | None = None,
    retrieval_metadata: dict | None = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        sources=sources,
        confidence_score=confidence_score,
        retrieval_metadata=retrieval_metadata,
    )
    db.add(msg)
    await db.flush()
    if settings.audit_log_enabled:
        db.add(
            AuditLog(
                conversation_id=conversation_id,
                event_type="chat.message",
                payload={"role": role, "confidence": confidence_score},
            )
        )
    return msg


async def maybe_summarize(
    db: AsyncSession,
    conversation: Conversation,
    llm_complete,
) -> list[dict[str, str]]:
    history = await load_history(db, conversation.id)
    if not settings.context_summarize_enabled:
        return history
    if len(history) <= settings.context_summarize_threshold:
        return history

    old = history[: -settings.max_history_messages // 2]
    recent = history[-settings.max_history_messages // 2 :]
    text = "\n".join(f"{m['role']}: {m['content']}" for m in old)
    summary = await llm_complete(
        "Summarize this conversation briefly for context:",
        text,
    )
    conversation.summary = summary
    await db.flush()
    return [{"role": "system", "content": f"Previous conversation summary: {summary}"}] + recent


def export_conversation_json(conversation: Conversation, messages: list[Message]) -> str:
    data = {
        "conversation_id": str(conversation.id),
        "session_id": conversation.session_id,
        "user_id": conversation.user_id,
        "user_email": conversation.user_email,
        "page_url": conversation.page_url,
        "summary": conversation.summary,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "sources": m.sources,
                "confidence_score": m.confidence_score,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }
    return json.dumps(data, indent=2)


def export_conversation_csv(conversation: Conversation, messages: list[Message]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["conversation_id", "session_id", "user_id", "role", "content", "confidence", "created_at"])
    for m in messages:
        writer.writerow(
            [
                str(conversation.id),
                conversation.session_id,
                conversation.user_id or "",
                m.role,
                m.content,
                m.confidence_score or "",
                m.created_at.isoformat() if m.created_at else "",
            ]
        )
    return output.getvalue()
