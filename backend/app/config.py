import json
import os
from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Core
    deployment_mode: str = "single_tenant"
    secret_key: str = "change-me"
    encryption_key: str = ""
    platform_url: str = ""
    super_admin_api_key: str = ""
    api_key: str = "rag_dev_api_key_change_me"
    widget_key: str = "wk_dev_widget_key_change_me"
    site_url: str = "http://localhost:3000"
    site_url_allow_subdomains: bool = True
    site_url_allow_localhost: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://rag:rag@localhost:5432/rag"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "documents"
    minio_secure: bool = False

    # LLM
    llm_provider: str = "ollama"
    llm_model: str = "llama3.2"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 1024
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    ollama_base_url: str = "http://localhost:11434"
    ollama_auto_pull: bool = True
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
    azure_openai_endpoint: str | None = None
    azure_openai_api_key: str | None = None
    azure_openai_deployment: str | None = None

    # Embeddings
    embedding_provider: str = "ollama"
    embedding_model: str = "nomic-embed-text"
    embedding_dimension: int = 768

    # Smart retrieval
    hybrid_search_enabled: bool = True
    hybrid_vector_weight: float = 0.7
    rerank_enabled: bool = False
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    query_rewrite_enabled: bool = False
    retrieval_top_k: int = 20
    rerank_top_k: int = 5
    confidence_threshold: float = 0.35
    soft_confidence_threshold: float = 0.12
    min_chunk_score: float = 0.08
    fallback_message: str = "I don't have enough information to answer that."
    general_chat_enabled: bool = True
    company_context: str = ""
    default_metadata_filter: dict[str, Any] = Field(default_factory=dict)

    # Persona
    default_system_prompt: str = "You are a helpful assistant. Answer only from the provided context."
    tone: str = "professional"
    language: str = "en"
    require_citations: bool = True
    max_answer_tokens: int = 512
    citation_format: str = "[{filename}, p.{page}]"
    starter_questions: list[str] = Field(
        default_factory=lambda: ["How can I help you?", "What services do you offer?"]
    )
    welcome_message: str = "Hi! Ask me anything about our documentation."

    # Conversation
    max_history_messages: int = 20
    context_summarize_enabled: bool = True
    context_summarize_threshold: int = 15
    conversation_retention_days: int = 90
    audit_log_enabled: bool = True
    forward_user_context_to_llm: bool = False

    # Widget
    widget_primary_color: str = "#4F46E5"
    widget_title: str = "Ask us anything"
    widget_position: str = "bottom-right"

    # Upload
    max_upload_mb: int = 25

    @field_validator("starter_questions", mode="before")
    @classmethod
    def parse_starter_questions(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v or []

    @field_validator("default_metadata_filter", mode="before")
    @classmethod
    def parse_metadata_filter(cls, v: Any) -> dict[str, Any]:
        if isinstance(v, str):
            if not v.strip():
                return {}
            return json.loads(v)
        return v or {}

    @property
    def cors_origins(self) -> list[str]:
        origins = [self.site_url.rstrip("/")]
        if self.platform_url:
            origins.append(self.platform_url.rstrip("/"))
        if self.site_url_allow_localhost:
            origins.extend(
                [
                    "http://localhost",
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://localhost:5173",
                    "http://localhost:8080",
                    "http://localhost:8090",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:3001",
                    "http://127.0.0.1:8080",
                    "http://127.0.0.1:8090",
                ]
            )
        return origins

    def collection_system_prompt(self, slug: str) -> str | None:
        key = f"COLLECTION_{slug.upper()}_SYSTEM_PROMPT"
        return os.environ.get(key)

    def collection_llm_provider(self, slug: str) -> str | None:
        return os.environ.get(f"COLLECTION_{slug.upper()}_LLM_PROVIDER")

    def collection_llm_model(self, slug: str) -> str | None:
        return os.environ.get(f"COLLECTION_{slug.upper()}_LLM_MODEL")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
