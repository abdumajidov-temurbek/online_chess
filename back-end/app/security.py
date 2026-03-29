import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt

from .config import settings


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def from_iso(value: str) -> datetime:
    return datetime.fromisoformat(value)


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    salt = salt or os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        encoded_salt, encoded_digest = password_hash.split("$", 1)
        salt = base64.b64decode(encoded_salt.encode())
        expected_digest = base64.b64decode(encoded_digest.encode())
    except Exception:
        return False

    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return hmac.compare_digest(candidate, expected_digest)


def sign_token(payload: Dict[str, Any], remember_me: bool = False) -> str:
    now = utc_now()
    ttl = settings.remember_me_ttl_seconds if remember_me else settings.access_token_ttl_seconds
    token_payload = {
        **payload,
        "iss": settings.jwt_issuer,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl)).timestamp()),
    }
    return jwt.encode(token_payload, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], issuer=settings.jwt_issuer)


def issue_reset_token() -> str:
    return base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
