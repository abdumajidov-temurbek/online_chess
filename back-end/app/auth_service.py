from datetime import timedelta
from typing import Any, Dict, Optional

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .config import settings
from .database import get_db
from .security import (
    from_iso,
    hash_password,
    hash_reset_token,
    issue_reset_token,
    sign_token,
    to_iso,
    utc_now,
    verify_password,
)


class AuthError(Exception):
    pass


def _serialize_user(row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "avatarUrl": row["avatar_url"],
        "createdAt": row["created_at"],
    }


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _serialize_user(row) if row else None


def register_user(name: str, email: str, password: str, remember_me: bool) -> Dict[str, Any]:
    if len(password) < 8:
        raise AuthError("Password must be at least 8 characters long.")

    now = to_iso(utc_now())
    email_normalized = email.strip().lower()
    password_hash = hash_password(password)

    with get_db() as db:
        existing = db.execute("SELECT id FROM users WHERE email = ?", (email_normalized,)).fetchone()
        if existing:
            raise AuthError("An account with that email already exists.")

        cursor = db.execute(
            """
            INSERT INTO users (email, password_hash, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (email_normalized, password_hash, name.strip(), now, now),
        )
        user_id = cursor.lastrowid

    user = get_user_by_id(user_id)
    return {"user": user, "token": sign_token({"sub": str(user_id)}, remember_me=remember_me)}


def login_user(email: str, password: str, remember_me: bool) -> Dict[str, Any]:
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()

    if not row or not row["password_hash"] or not verify_password(password, row["password_hash"]):
        raise AuthError("Invalid email or password.")

    return {"user": _serialize_user(row), "token": sign_token({"sub": str(row["id"])}, remember_me=remember_me)}


def login_with_google(credential: str, remember_me: bool) -> Dict[str, Any]:
    if not settings.google_client_id:
        raise AuthError("Google OAuth is not configured.")

    try:
        payload = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception as exc:
        raise AuthError("Google sign-in failed.") from exc

    email = payload.get("email", "").strip().lower()
    if not email:
        raise AuthError("Google did not provide an email address.")

    now = to_iso(utc_now())
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            db.execute(
                """
                UPDATE users
                SET google_sub = COALESCE(google_sub, ?),
                    avatar_url = COALESCE(?, avatar_url),
                    updated_at = ?
                WHERE id = ?
                """,
                (payload.get("sub"), payload.get("picture"), now, row["id"]),
            )
            user_id = row["id"]
        else:
            cursor = db.execute(
                """
                INSERT INTO users (email, password_hash, name, avatar_url, google_sub, created_at, updated_at)
                VALUES (?, NULL, ?, ?, ?, ?, ?)
                """,
                (
                    email,
                    payload.get("name") or email.split("@")[0],
                    payload.get("picture"),
                    payload.get("sub"),
                    now,
                    now,
                ),
            )
            user_id = cursor.lastrowid

    user = get_user_by_id(user_id)
    return {"user": user, "token": sign_token({"sub": str(user_id)}, remember_me=remember_me)}


def create_reset_token(email: str) -> Dict[str, Any]:
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if not row:
            return {"message": "If that email exists, a reset link has been prepared."}

        raw_token = issue_reset_token()
        token_hash = hash_reset_token(raw_token)
        expires_at = to_iso(utc_now() + timedelta(seconds=settings.reset_token_ttl_seconds))
        db.execute(
            """
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (row["id"], token_hash, expires_at, to_iso(utc_now())),
        )

    return {
        "message": "If that email exists, a reset link has been prepared.",
        "resetUrl": f"{settings.reset_url_base}?token={raw_token}",
    }


def reset_password(token: str, password: str) -> None:
    if len(password) < 8:
        raise AuthError("Password must be at least 8 characters long.")

    with get_db() as db:
        row = db.execute(
            """
            SELECT * FROM password_reset_tokens
            WHERE token_hash = ? AND used_at IS NULL
            ORDER BY id DESC
            """,
            (hash_reset_token(token),),
        ).fetchone()

        if not row or from_iso(row["expires_at"]) < utc_now():
            raise AuthError("Reset token is invalid or expired.")

        db.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (hash_password(password), to_iso(utc_now()), row["user_id"]),
        )
        db.execute(
            "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
            (to_iso(utc_now()), row["id"]),
        )


def build_auth_response(token: str, user: Dict[str, Any]) -> Dict[str, Any]:
    return {"user": user, "token": token}
