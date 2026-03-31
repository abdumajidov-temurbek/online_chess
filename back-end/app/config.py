import os
from dataclasses import dataclass


@dataclass
class Settings:
    app_name: str = os.getenv("APP_NAME", "Castle")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "5000"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    auth_cookie_name: str = os.getenv("AUTH_COOKIE_NAME", "castle_auth")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "castle-api")
    access_token_ttl_seconds: int = int(os.getenv("ACCESS_TOKEN_TTL_SECONDS", str(60 * 60 * 24)))
    remember_me_ttl_seconds: int = int(os.getenv("REMEMBER_ME_TTL_SECONDS", str(60 * 60 * 24 * 30)))
    reset_token_ttl_seconds: int = int(os.getenv("RESET_TOKEN_TTL_SECONDS", str(60 * 30)))
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    database_path: str = os.getenv("DATABASE_PATH", "./castle.sqlite3")
    secure_cookies: bool = os.getenv("SECURE_COOKIES", "false").lower() == "true"
    reset_url_base: str = os.getenv("RESET_URL_BASE", "http://localhost:3000/reset-password")


settings = Settings()
