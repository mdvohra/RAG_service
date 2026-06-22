from urllib.parse import urlparse

from fastapi import HTTPException, Request

from app.config import settings
from app.core.tenant_config import tenant_site_url
from app.models import Tenant


def _normalize_origin(url: str) -> str:
    parsed = urlparse(url.strip())
    port = f":{parsed.port}" if parsed.port and parsed.port not in (80, 443) else ""
    return f"{parsed.scheme}://{parsed.hostname}{port}".rstrip("/")


def _is_localhost(origin: str) -> bool:
    parsed = urlparse(origin)
    return parsed.hostname in ("localhost", "127.0.0.1")


def is_origin_allowed(origin: str | None, referer: str | None = None, tenant: Tenant | None = None) -> bool:
    candidate = origin or referer
    if not candidate:
        return settings.site_url_allow_localhost

    normalized = _normalize_origin(candidate)

    if settings.site_url_allow_localhost and _is_localhost(normalized):
        return True

    site = _normalize_origin(tenant_site_url(tenant))
    if normalized == site:
        return True

    if settings.site_url_allow_subdomains:
        site_parsed = urlparse(site)
        origin_parsed = urlparse(normalized)
        if (
            site_parsed.hostname
            and origin_parsed.hostname
            and origin_parsed.hostname.endswith(f".{site_parsed.hostname}")
            and origin_parsed.scheme == site_parsed.scheme
        ):
            return True

    return False


def validate_widget_origin(request: Request, tenant: Tenant | None = None) -> None:
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    if not is_origin_allowed(origin, referer, tenant):
        site = tenant_site_url(tenant)
        raise HTTPException(
            status_code=403,
            detail=f"Origin not allowed. Requests must come from {site}",
        )
