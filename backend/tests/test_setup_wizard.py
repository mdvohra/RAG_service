"""Tests for the setup wizard UI and the API endpoints it calls."""

import os
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]
WIZARD_ENTRY = ROOT / "setup-wizard" / "index.html"
WIZARD_API = ROOT / "setup-wizard" / "src" / "api.ts"
WIZARD_DIST = ROOT / "setup-wizard" / "dist" / "index.html"
WIZARD_BASE = os.getenv("TEST_WIZARD_URL", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "rag_dev_api_key_change_me")
WIDGET_DIST = ROOT / "widget" / "dist" / "embed.js"


def test_setup_wizard_source_contains_wizard_flow():
    entry = WIZARD_ENTRY.read_text(encoding="utf-8")
    api = WIZARD_API.read_text(encoding="utf-8")
    assert "RAG Embed" in entry
    assert "/v1/ready" in api
    assert "/v1/config/llm/test" in api
    assert "/v1/collections" in api


def test_setup_wizard_dist_build_output():
    if not WIZARD_DIST.exists():
        pytest.skip("Run: cd setup-wizard && npm install && npm run build")
    text = WIZARD_DIST.read_text(encoding="utf-8")
    assert "RAG Embed" in text or "setup-wizard" in text.lower()


def test_widget_embed_built():
    if not WIDGET_DIST.exists():
        pytest.skip("Run: cd widget && npm run build")
    content = WIDGET_DIST.read_text(encoding="utf-8")
    assert len(content) > 1000
    assert "RagEmbed" in content or "rag-embed" in content.lower()


def test_setup_wizard_page_served():
    try:
        response = httpx.get(WIZARD_BASE, timeout=5.0)
    except httpx.HTTPError:
        pytest.skip(f"Setup wizard not running at {WIZARD_BASE}")
    assert response.status_code == 200
    assert "RAG Embed" in response.text


def test_setup_wizard_ready_check(api_client):
    response = api_client.get("/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["checks"]["database"] is True
    assert data["checks"]["minio"] is True
    assert "llm" in data["checks"]


def test_setup_wizard_list_collections(api_client, auth_headers):
    response = api_client.get("/v1/collections", headers=auth_headers)
    assert response.status_code == 200
    collections = response.json()
    assert isinstance(collections, list)
    assert any(c.get("slug") == "default" for c in collections)


def test_setup_wizard_upload_document(api_client, auth_headers):
    collections = api_client.get("/v1/collections", headers=auth_headers).json()
    collection_id = next(c["id"] for c in collections if c["slug"] == "default")
    content = b"Refund policy: returns within 30 days."

    response = api_client.post(
        f"/v1/collections/{collection_id}/documents",
        headers=auth_headers,
        files={"file": ("faq.txt", content, "text/plain")},
        data={"metadata": "{}"},
    )
    assert response.status_code == 200
    doc = response.json()
    assert doc["filename"] == "faq.txt"
    assert doc["status"] in ("pending", "processing", "ready")


def test_setup_wizard_llm_probe_endpoint(api_client):
    response = api_client.post(
        "/v1/config/llm/test",
        json={"provider": "openai", "api_key": "invalid-key", "message": "Hi"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is False
    assert "error" in data


@pytest.mark.integration
def test_setup_wizard_chat_non_stream(api_client, auth_headers):
    ready = api_client.get("/v1/ready").json()
    if not ready["checks"].get("llm", {}).get("ok"):
        pytest.skip("LLM not available (run: docker compose --profile local-llm up -d)")

    response = api_client.post(
        "/v1/chat",
        headers=auth_headers,
        json={"message": "Hello", "stream": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("content")
