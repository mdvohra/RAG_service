import asyncio
import io
import uuid

from pypdf import PdfReader
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.embeddings.factory import get_embedding_provider
from app.database import async_session
from app.models import Chunk, Document, DocumentStatus
from app.services.storage import get_minio_client


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def chunk_text(text: str) -> list[str]:
    paragraphs = [p.strip() for p in text.replace("\r\n", "\n").split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    chunks: list[str] = []
    for paragraph in paragraphs:
        if len(paragraph) <= CHUNK_SIZE:
            if paragraph:
                chunks.append(paragraph)
            continue
        start = 0
        while start < len(paragraph):
            end = start + CHUNK_SIZE
            piece = paragraph[start:end].strip()
            if piece:
                chunks.append(piece)
            start = end - CHUNK_OVERLAP

    return chunks


def parse_file(filename: str, data: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if lower.endswith((".txt", ".md", ".markdown", ".html", ".htm")):
        return data.decode("utf-8", errors="ignore")
    return data.decode("utf-8", errors="ignore")


async def process_document(document_id: str) -> None:
    async with async_session() as db:
        doc = await db.get(Document, uuid.UUID(document_id))
        if not doc:
            return

        doc.status = DocumentStatus.processing
        await db.commit()

        try:
            client = get_minio_client()
            response = client.get_object(settings.minio_bucket, doc.minio_path)
            data = response.read()
            response.close()
            response.release_conn()

            text = parse_file(doc.filename, data)
            pieces = chunk_text(text)
            embedder = get_embedding_provider()

            await db.execute(delete(Chunk).where(Chunk.document_id == doc.id))

            for i in range(0, len(pieces), 10):
                batch = pieces[i : i + 10]
                vectors = await embedder.embed(batch)
                for j, (content, vector) in enumerate(zip(batch, vectors)):
                    chunk = Chunk(
                        document_id=doc.id,
                        content=content,
                        chunk_index=i + j,
                        metadata_={
                            **doc.metadata_,
                            "filename": doc.filename,
                            "page": (i + j) // 3 + 1,
                        },
                        embedding=vector,
                    )
                    db.add(chunk)

            doc.status = DocumentStatus.ready
            doc.error_message = None
            await db.commit()
        except Exception as e:
            doc.status = DocumentStatus.failed
            doc.error_message = str(e)
            await db.commit()


async def enqueue_document(ctx: dict, document_id: str) -> None:
    await process_document(document_id)
