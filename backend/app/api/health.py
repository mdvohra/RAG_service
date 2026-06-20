from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.core.llm.factory import check_llm_health, get_llm_config_status
from app.core.llm.probe import openai_env_hint, probe_llm
from app.services.storage import ensure_bucket, get_minio_client

router = APIRouter(tags=["health"])


class LLMTestRequest(BaseModel):
    provider: str = "openai"
    api_key: str | None = None
    model: str | None = None
    base_url: str | None = None
    message: str = "Hello"


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    checks = {"database": True, "minio": False, "llm": {}, "embedding_provider": settings.embedding_provider}

    try:
        client = get_minio_client()
        checks["minio"] = client.bucket_exists(settings.minio_bucket)
    except Exception as e:
        checks["minio"] = False
        checks["minio_error"] = str(e)

    checks["llm"] = await check_llm_health()
    return {"status": "ready" if checks["minio"] else "degraded", "checks": checks}


@router.get("/config/llm")
async def llm_config():
    return get_llm_config_status()


@router.post("/config/llm/test")
async def test_llm(body: LLMTestRequest):
    """Test LLM connectivity only (no document search). Setup wizard uses this."""
    result = await probe_llm(
        provider=body.provider,
        message=body.message,
        api_key=body.api_key,
        model=body.model,
        base_url=body.base_url,
    )
    if body.provider == "openai" and result.get("ok"):
        result["env_hint"] = openai_env_hint()
        result["note"] = (
            "LLM test passed. Add these lines to .env and restart api + worker "
            "for full chat with document search."
        )
    return result
