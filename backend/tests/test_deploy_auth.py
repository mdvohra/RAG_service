"""Auth and deployment configuration tests."""

import os
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]


def test_deploy_onprem_compose_exists():
    assert (ROOT / "deploy" / "docker-compose.onprem.yml").exists()
    assert (ROOT / "deploy" / "Caddyfile.onprem").exists()
    assert (ROOT / "deploy" / "on-prem" / "README.md").exists()


def test_deploy_saas_compose_exists():
    assert (ROOT / "deploy" / "docker-compose.saas.yml").exists()
    assert (ROOT / "deploy" / "Caddyfile.saas").exists()
    assert (ROOT / "deploy" / "saas" / "README.md").exists()
    assert (ROOT / "platform-ui" / "package.json").exists()


def test_backend_dockerfile_builds_widget():
    dockerfile = (ROOT / "backend" / "Dockerfile").read_text(encoding="utf-8")
    assert "widget-build" in dockerfile
    assert "embed.js" in dockerfile or "widget/dist" in dockerfile


@pytest.mark.integration
def test_auth_signup_requires_multi_tenant(api_client):
    """Signup returns 400 in default single_tenant mode."""
    response = api_client.post(
        "/v1/auth/signup",
        json={
            "email": "test@example.com",
            "password": "password123",
            "org_name": "Test Org",
        },
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_auth_flow_multi_tenant(monkeypatch):
    """Full signup → me → settings when DEPLOYMENT_MODE=multi_tenant."""
    api_base = os.getenv("TEST_API_URL", "http://localhost:8000")
    if not httpx.get(f"{api_base}/v1/health", timeout=2.0).is_success:
        pytest.skip("API not running")

    email = f"user_{os.getpid()}@test.local"
    signup = httpx.post(
        f"{api_base}/v1/auth/signup",
        json={"email": email, "password": "password123", "org_name": "Acme"},
        timeout=30.0,
    )
    if signup.status_code == 400 and "multi_tenant" in signup.text:
        pytest.skip("API not in multi_tenant mode")
    assert signup.status_code == 200
    data = signup.json()
    token = data["access_token"]
    assert data.get("widget_key")
    assert data.get("api_key")

    me = httpx.get(
        f"{api_base}/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10.0,
    )
    assert me.status_code == 200
    assert me.json()["email"] == email

    settings = httpx.get(
        f"{api_base}/v1/dashboard/settings",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10.0,
    )
    assert settings.status_code == 200
