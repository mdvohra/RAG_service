import os

import httpx
import pytest

API_BASE = os.getenv("TEST_API_URL", "http://localhost:8000")
WIZARD_BASE = os.getenv("TEST_WIZARD_URL", "http://localhost:8080")
API_KEY = os.getenv("API_KEY", "rag_dev_api_key_change_me")


def _api_available() -> bool:
    try:
        return httpx.get(f"{API_BASE}/v1/health", timeout=2.0).status_code == 200
    except httpx.HTTPError:
        return False


@pytest.fixture
def require_api():
    if not _api_available():
        pytest.skip(f"API not running at {API_BASE}")


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {API_KEY}"}


@pytest.fixture
def api_client(require_api):
    with httpx.Client(base_url=API_BASE, timeout=30.0) as client:
        yield client
