from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

WEAK_JWT_SECRETS = {
    "replace-with-a-long-random-string",
    "dev-only-change-me",
    "change-me",
    "secret",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_debug: bool = False
    api_prefix: str = "/v1"
    frontend_origin: str = "http://localhost:3000"
    extra_cors_origins: str = ""

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "pm_agent"

    jwt_secret: str = Field(default="dev-only-change-me")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 14
    auth_require_email_verification: bool = False

    webhook_ingest_secret: str = ""
    freshdesk_webhook_secret: str = ""

    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    s3_bucket: str = ""
    s3_presign_expires_seconds: int = 300
    s3_max_upload_bytes: int = 10 * 1024 * 1024

    pinecone_api_key: str = ""
    pinecone_index: str = ""
    pinecone_namespace: str = "pm-agent"

    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_embed_model: str = "text-embedding-3-small"

    github_token: str = ""

    google_client_id: str = ""
    google_client_secret: str = ""

    smtp_from: str = "Ask PM <noreply@localhost>"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    resend_api_key: str = ""

    allowed_upload_types: str = (
        "application/pdf,text/plain,text/markdown,application/msword,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    @property
    def public_origin(self) -> str:
        return (self.frontend_origin or "http://localhost:3000").rstrip("/")

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.public_origin}/auth/google/callback"

    @property
    def allowed_upload_type_set(self) -> set[str]:
        return {item.strip() for item in self.allowed_upload_types.split(",") if item.strip()}

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        origins: list[str] = []
        for raw in [self.frontend_origin, *self.extra_cors_origins.split(",")]:
            cleaned = raw.strip().rstrip("/")
            if cleaned and cleaned not in origins:
                origins.append(cleaned)
        if not self.is_production:
            for local in ("http://localhost:3000", "http://127.0.0.1:3000"):
                if local not in origins:
                    origins.append(local)
        return origins

    @property
    def email_configured(self) -> bool:
        if self.resend_api_key or (self.smtp_host and self.smtp_from):
            return True
        return not self.is_production

    @property
    def jwt_is_weak(self) -> bool:
        secret = (self.jwt_secret or "").strip()
        return len(secret) < 32 or secret in WEAK_JWT_SECRETS

    def validate_runtime(self) -> None:
        if not self.is_production:
            return
        if self.jwt_is_weak:
            raise RuntimeError("JWT_SECRET must be a random string of at least 32 characters in production")
        uri = (self.mongodb_uri or "").lower()
        if "localhost" in uri or "127.0.0.1" in uri:
            raise RuntimeError("MONGODB_URI must point at a remote database in production")
        origin = self.frontend_origin.rstrip("/")
        if origin.startswith("http://") and "localhost" not in origin and "127.0.0.1" not in origin:
            raise RuntimeError("FRONTEND_ORIGIN must use https in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
