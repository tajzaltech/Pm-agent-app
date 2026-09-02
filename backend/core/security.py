from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from core.config import settings

ACCESS_TOKEN_TYPE = "access"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def hash_token(raw: str) -> str:
    return bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_token_hash(raw: str, token_hash: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode("utf-8"), token_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    *,
    user_id: str,
    email: str,
    name: str = "",
    workspace_id: str = "",
) -> str:
    now = datetime.now(timezone.utc)
    minutes = settings.access_token_minutes
    if settings.use_memory_store:
        minutes = max(minutes, 60 * 24 * 14)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "wid": workspace_id,
        "typ": ACCESS_TOKEN_TYPE,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("typ") != ACCESS_TOKEN_TYPE:
        raise jwt.InvalidTokenError("Invalid token type")
    return payload
