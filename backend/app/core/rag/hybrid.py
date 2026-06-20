from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.rag.query_rewrite import RetrievedChunk


async def hybrid_search(
    db: AsyncSession,
    query_embedding: list[float],
    query_text: str,
    collection_id: str | None = None,
    filters: dict[str, Any] | None = None,
    top_k: int | None = None,
) -> list[RetrievedChunk]:
    top_k = top_k or settings.retrieval_top_k
    merged_filters = {**settings.default_metadata_filter, **(filters or {})}

    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
    vector_weight = settings.hybrid_vector_weight if settings.hybrid_search_enabled else 1.0
    keyword_weight = 1.0 - vector_weight

    filter_clauses = []
    params: dict[str, Any] = {
        "embedding": embedding_str,
        "query": query_text,
        "top_k": top_k,
        "vector_weight": vector_weight,
        "keyword_weight": keyword_weight,
    }

    if collection_id:
        filter_clauses.append("d.collection_id = CAST(:collection_id AS uuid)")
        params["collection_id"] = collection_id

    for i, (key, value) in enumerate(merged_filters.items()):
        param_name = f"meta_{i}"
        filter_clauses.append(f"c.metadata @> CAST(:{param_name} AS jsonb)")
        params[param_name] = f'{{"{key}": "{value}"}}'

    where_extra = (" AND " + " AND ".join(filter_clauses)) if filter_clauses else ""

    if settings.hybrid_search_enabled:
        sql = f"""
        SELECT c.id, c.content, c.metadata, d.filename,
          (
            :vector_weight * (1 - (c.embedding <=> CAST(:embedding AS vector))) +
            :keyword_weight * similarity(c.content, :query)
          ) AS score
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.embedding IS NOT NULL AND d.status = 'ready'{where_extra}
        ORDER BY score DESC
        LIMIT :top_k
        """
    else:
        sql = f"""
        SELECT c.id, c.content, c.metadata, d.filename,
          (1 - (c.embedding <=> CAST(:embedding AS vector))) AS score
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.embedding IS NOT NULL AND d.status = 'ready'{where_extra}
        ORDER BY c.embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
        """

    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    return [
        RetrievedChunk(
            id=str(row.id),
            content=row.content,
            score=float(row.score),
            metadata=row.metadata or {},
            filename=row.filename,
        )
        for row in rows
    ]
