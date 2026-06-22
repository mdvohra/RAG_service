"""Fernet encryption for tenant secrets (LLM API keys)."""

import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _fernet_key() -> bytes:
    raw = settings.encryption_key or settings.secret_key
    digest = hashlib.sha256(raw.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_value(value: str) -> str:
    if not value:
        return ""
    return Fernet(_fernet_key()).encrypt(value.encode()).decode()


def decrypt_value(token: str) -> str:
    if not token:
        return ""
    return Fernet(_fernet_key()).decrypt(token.encode()).decode()
