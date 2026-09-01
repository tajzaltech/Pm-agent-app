from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_debug: bool = False
    api_prefix: str = "/v1"
    frontend_origin: str = "http://localhost:3000"

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

    allowed_upload_types: str = (
        "application/pdf,text/plain,text/markdown,application/msword,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    @property
    def google_redirect_uri(self) -> str:
        return f"{self.frontend_origin.rstrip('/')}/auth/google/callback"

    @property
    def allowed_upload_type_set(self) -> set[str]:
        return {item.strip() for item in self.allowed_upload_types.split(",") if item.strip()}

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
