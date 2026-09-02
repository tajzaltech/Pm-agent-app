from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from models.common import ORMModel, StrictModel
from models.enums import UserRole


class SignUpRequestSchema(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    company: str = Field(min_length=1, max_length=160)

    @field_validator("name", "company")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("must not be blank")
        return cleaned


class SignInRequestSchema(StrictModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleAuthRequestSchema(StrictModel):
    code: str = Field(min_length=8, max_length=4096)
    company: str | None = Field(default=None, max_length=160)
    redirect_uri: str | None = Field(default=None, max_length=500)

    @field_validator("company")
    @classmethod
    def strip_company(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("redirect_uri")
    @classmethod
    def strip_redirect(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ForgotPasswordRequestSchema(StrictModel):
    email: EmailStr


class ResetPasswordRequestSchema(StrictModel):
    token: str = Field(min_length=8)
    password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequestSchema(StrictModel):
    token: str = Field(min_length=8)


class RefreshRequestSchema(StrictModel):
    refresh_token: str = Field(min_length=8)


class UserResponseSchema(StrictModel):
    # COMPLIANCE: PII — name, email. Do not log this schema in plaintext.
    id: str
    name: str
    email: EmailStr
    email_verified: bool
    default_workspace_id: str | None = None


class AuthTokenResponseSchema(StrictModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponseSchema
    action_url: str | None = None


class MessageResponseSchema(StrictModel):
    ok: bool = True
    message: str
    action_url: str | None = None


class UserDBModel(ORMModel):
    # COMPLIANCE: PII — name, email stored for account identity. Deletable via user record.
    id: str = Field(alias="_id")
    name: str
    email: str
    password_hash: str = ""
    email_verified: bool = False
    auth_provider: str = "password"
    google_sub: str | None = None
    default_workspace_id: str | None = None
    created_at: datetime
    updated_at: datetime


class AuthTokenDBModel(ORMModel):
    id: str = Field(alias="_id")
    user_id: str
    kind: str
    token_hash: str
    expires_at: datetime
    created_at: datetime
    used_at: datetime | None = None


class WorkspaceMemberDBModel(ORMModel):
    # COMPLIANCE: PII — email/name denormalized for invites. Deletable with membership.
    id: str = Field(alias="_id")
    workspace_id: str
    user_id: str
    role: UserRole
    name: str
    email: str
    status: str
    avatar_initials: str
    created_at: datetime
