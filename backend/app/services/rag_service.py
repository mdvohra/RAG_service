from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.conversation import load_history, maybe_summarize, save_message
from app.core.embeddings.factory import get_embedding_provider
from app.core.llm.base import LLMMessage
from app.core.llm.factory import get_llm_provider
from app.core.persona import build_general_system_prompt, build_system_prompt
from app.core.rag.hybrid import hybrid_search
from app.core.rag.intent import (
    is_document_overview_question,
    is_greeting,
    is_support_question,
)
from app.core.rag.query_rewrite import (
    compute_confidence,
    rewrite_query,
    should_fallback,
    should_soft_rag,
    should_strict_rag,
)
from app.core.rag.reranker import rerank_chunks
from app.models import Conversation


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedder = get_embedding_provider()

    async def retrieve(
        self,
        query: str,
        collection_id: str | None = None,
        collection_slug: str | None = None,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[dict], float, dict]:
        rewritten = await rewrite_query(query)
        embedding = await self.embedder.embed_query(rewritten)
        chunks = await hybrid_search(
            self.db, embedding, rewritten, collection_id=collection_id, filters=filters
        )
        chunks = [c for c in chunks if c.score >= settings.min_chunk_score]
        chunks = rerank_chunks(rewritten, chunks)
        scores = [c.score for c in chunks]
        confidence = compute_confidence(scores)

        sources = [
            {
                "id": c.id,
                "filename": c.filename,
                "content": c.content[:300],
                "score": c.score,
                "metadata": c.metadata,
            }
            for c in chunks
        ]
        meta = {"rewritten_query": rewritten, "scores": scores}
        return sources, confidence, meta

    def _build_context(self, sources: list[dict]) -> str:
        parts = []
        for i, s in enumerate(sources, 1):
            page = s.get("metadata", {}).get("page", "?")
            parts.append(f"[{i}] ({s['filename']}, p.{page}): {s['content']}")
        return "\n\n".join(parts)

    def _document_names(self, sources: list[dict]) -> list[str]:
        return sorted({s["filename"] for s in sources if s.get("filename")})

    async def _stream_text_response(
        self,
        conversation: Conversation,
        text: str,
        confidence: float,
        sources: list[dict],
        retrieval_meta: dict,
    ) -> AsyncIterator[dict]:
        yield {"type": "confidence", "confidence": confidence}
        if sources:
            yield {"type": "sources", "sources": sources}

        yield {"type": "token", "content": text}
        await save_message(
            self.db,
            conversation.id,
            "assistant",
            text,
            sources=sources,
            confidence_score=confidence,
            retrieval_metadata=retrieval_meta,
        )
        yield {"type": "done", "sources": sources, "site_url": settings.site_url}

    async def _stream_llm_answer(
        self,
        conversation: Conversation,
        message: str,
        system: str,
        confidence: float,
        sources: list[dict],
        retrieval_meta: dict,
        collection_slug: str | None = None,
    ) -> AsyncIterator[dict]:
        llm = get_llm_provider(collection_slug)

        async def complete_fn(sys_prompt: str, text: str) -> str:
            return await llm.complete(sys_prompt, [LLMMessage(role="user", content=text)])

        raw_history = await maybe_summarize(self.db, conversation, complete_fn)
        history = [LLMMessage(role=m["role"], content=m["content"]) for m in raw_history]
        history.append(LLMMessage(role="user", content=message))

        yield {"type": "confidence", "confidence": confidence}
        if sources:
            yield {"type": "sources", "sources": sources}

        full_response = []
        async for token in llm.stream(system, history):
            full_response.append(token)
            yield {"type": "token", "content": token}

        content = "".join(full_response)
        await save_message(
            self.db,
            conversation.id,
            "assistant",
            content,
            sources=sources,
            confidence_score=confidence,
            retrieval_metadata=retrieval_meta,
        )
        yield {"type": "done", "sources": sources, "site_url": settings.site_url}

    async def chat_stream(
        self,
        conversation: Conversation,
        message: str,
        collection_slug: str | None = None,
        collection_id: str | None = None,
        filters: dict[str, Any] | None = None,
    ) -> AsyncIterator[dict]:
        sources, confidence, retrieval_meta = await self.retrieve(
            message, collection_id=collection_id, collection_slug=collection_slug, filters=filters
        )
        document_names = self._document_names(sources)

        await save_message(self.db, conversation.id, "user", message)

        if is_greeting(message) and settings.general_chat_enabled:
            system = build_general_system_prompt(document_names)
            async for event in self._stream_llm_answer(
                conversation,
                message,
                system,
                1.0,
                [],
                {"intent": "greeting"},
                collection_slug,
            ):
                yield event
            return

        if is_document_overview_question(message) and document_names:
            listing = "\n".join(f"- {name}" for name in document_names)
            reply = (
                "Your knowledge base includes:\n"
                f"{listing}\n\n"
                "Ask me anything specific about these documents."
            )
            async for event in self._stream_text_response(
                conversation, reply, confidence, sources[:3], retrieval_meta
            ):
                yield event
            return

        if is_support_question(message) and settings.general_chat_enabled:
            system = build_general_system_prompt(document_names)
            async for event in self._stream_llm_answer(
                conversation,
                message,
                system,
                1.0,
                [],
                {"intent": "support"},
                collection_slug,
            ):
                yield event
            return

        if should_strict_rag(confidence) and sources:
            context = self._build_context(sources)
            system = build_system_prompt(collection_slug, context, strict=True)
            async for event in self._stream_llm_answer(
                conversation,
                message,
                system,
                confidence,
                sources,
                retrieval_meta,
                collection_slug,
            ):
                yield event
            return

        if should_soft_rag(confidence) and sources:
            context = self._build_context(sources)
            system = build_system_prompt(collection_slug, context, strict=False)
            async for event in self._stream_llm_answer(
                conversation,
                message,
                system,
                confidence,
                sources,
                retrieval_meta,
                collection_slug,
            ):
                yield event
            return

        if settings.general_chat_enabled:
            system = build_general_system_prompt(document_names)
            if sources:
                system += (
                    "\n\n--- POSSIBLY RELATED EXCERPTS (use only if relevant) ---\n"
                    + self._build_context(sources[:2])
                )
            async for event in self._stream_llm_answer(
                conversation,
                message,
                system,
                confidence,
                sources[:2] if sources else [],
                retrieval_meta,
                collection_slug,
            ):
                yield event
            return

        fallback = settings.fallback_message
        await save_message(
            self.db,
            conversation.id,
            "assistant",
            fallback,
            sources=[],
            confidence_score=confidence,
            retrieval_metadata=retrieval_meta,
        )
        yield {"type": "confidence", "confidence": confidence}
        yield {"type": "fallback", "content": fallback}
        yield {"type": "done", "sources": [], "site_url": settings.site_url}
