from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, chat, collections, dashboard, documents, health, tenants
from app.config import settings
from app.services.storage import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ensure_bucket()
    except Exception as e:
        print(f"MinIO bucket check: {e}")
    yield


app = FastAPI(title="RAG Embed API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/v1")
app.include_router(auth.router, prefix="/v1")
app.include_router(dashboard.router, prefix="/v1")
app.include_router(chat.router, prefix="/v1")
app.include_router(collections.router, prefix="/v1")
app.include_router(documents.router, prefix="/v1")
app.include_router(tenants.router, prefix="/v1")

widget_dist = Path(__file__).resolve().parents[1] / "widget" / "dist"
if widget_dist.exists():
    app.mount("/widget/v1", StaticFiles(directory=widget_dist), name="widget")
