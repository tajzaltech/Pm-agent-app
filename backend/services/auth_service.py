from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from core.config import settings
from core.errors import conflict, unauthorized
from core.ids import initials, new_id, utcnow
from core.security import (
    create_access_token,
    hash_password,
    hash_token,
    verify_password,
    verify_token_hash,
)
from models.auth import (
    AuthTokenResponseSchema,
    ForgotPasswordRequestSchema,
    GoogleAuthRequestSchema,
    ResetPasswordRequestSchema,
    SignInRequestSchema,
    SignUpRequestSchema,
    UserResponseSchema,
    VerifyEmailRequestSchema,
)
from services.context import Actor, Repos, as_id, iso


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _user_response(doc: dict) -> UserResponseSchema:
    data = as_id(doc)
    return UserResponseSchema(
        id=data["id"],
        name=data["name"],
        email=data["email"],
        email_verified=bool(data.get("email_verified")),
        default_workspace_id=data.get("default_workspace_id"),
    )


async def _issue_refresh(repos: Repos, user_id: str) -> str:
    raw = token_urlsafe(32)
    now = utcnow()
    await repos.tokens.insert(
        {
            "_id": new_id("tok"),
            "user_id": user_id,
            "kind": "refresh",
            "token_hash": hash_token(raw),
            "expires_at": now + timedelta(days=settings.refresh_token_days),
            "created_at": now,
            "used_at": None,
        }
    )
    return raw


async def _seed_workspace(repos: Repos, *, user_id: str, name: str, email: str, company: str) -> str:
    now = utcnow()
    workspace_id = new_id("ws")
    slug = company.lower().replace(" ", "-")[:40]
    await repos.workspaces.insert(
        {
            "_id": workspace_id,
            "name": company,
            "slug": slug,
            "description": "",
            "initials": initials(company),
            "owner_id": user_id,
            "ingest_secret": token_urlsafe(24),
            "created_at": now,
            "updated_at": now,
        }
    )
    await repos.members.insert(
        {
            "_id": new_id("mem"),
            "workspace_id": workspace_id,
            "user_id": user_id,
            "role": "owner",
            "name": name,
            "email": email,
            "status": "active",
            "avatar_initials": initials(name),
            "created_at": now,
        }
    )
    await repos.onboarding.insert(
        {
            "_id": new_id("ob"),
            "workspace_id": workspace_id,
            "step": "1",
            "is_setup": False,
            "workspace_role": "pm",
            "ticket_sources": [],
            "repo_provider": None,
            "repo_provider_status": "idle",
            "selected_repos": [],
            "output_tool": None,
            "output_tool_status": "idle",
            "selected_project": None,
            "indexing_status": "idle",
            "indexing_step": "",
            "updated_at": now,
        }
    )
    await repos.automation.insert(
        {
            "_id": new_id("auto"),
            "workspace_id": workspace_id,
            "preset": "balanced",
            "auto_classify": True,
            "scope_estimation": True,
            "auto_dispatch": False,
            "auto_accept_rules": [
                {
                    "id": "preset_qs",
                    "classification": "question",
                    "scope": "S",
                    "enabled": True,
                    "action": "auto_accept",
                }
            ],
            "updated_at": now,
        }
    )
    await repos.delivery_configs.insert(
        {
            "_id": new_id("dcfg"),
            "workspace_id": workspace_id,
            "enabled": False,
            "default_tool": "jira",
            "auto_deliver": False,
            "default_assignee_id": "",
            "tool_webhook_url": "",
            "updated_at": now,
        }
    )
    await repos.dispatch_configs.insert(
        {
            "_id": new_id("scfg"),
            "workspace_id": workspace_id,
            "enabled": False,
            "agent_type": "claude-code",
            "webhook_url": "",
            "branch_pattern": "fix/{id}",
            "custom_branch_pattern": "",
            "include_code_refs": True,
            "include_approach": True,
            "updated_at": now,
        }
    )
    return workspace_id


def _workspace_name_from_google(name: str, email: str, company: str | None) -> str:
    if company:
        return company
    domain = email.split("@")[-1]
    if domain in {"gmail.com", "googlemail.com"}:
        return f"{name}'s workspace"[:160]
    label = domain.split(".")[0].replace("-", " ").replace("_", " ").title()
    return (label or f"{name}'s workspace")[:160]


async def _auth_tokens(repos: Repos, user: dict) -> AuthTokenResponseSchema:
    refresh = await _issue_refresh(repos, user["_id"])
    return AuthTokenResponseSchema(
        access_token=create_access_token(
            user_id=user["_id"],
            email=user["email"],
            name=str(user.get("name") or ""),
            workspace_id=str(user.get("default_workspace_id") or ""),
        ),
        refresh_token=refresh,
        user=_user_response(user),
    )


async def signup(repos: Repos, body: SignUpRequestSchema) -> AuthTokenResponseSchema:
    existing = await repos.users.find_by_email(str(body.email))
    if existing:
        raise conflict("An account with this email already exists")
    now = utcnow()
    user_id = new_id("usr")
    email = str(body.email).lower()
    workspace_id = await _seed_workspace(
        repos, user_id=user_id, name=body.name, email=email, company=body.company
    )
    user = {
        "_id": user_id,
        "name": body.name,
        "email": email,
        "password_hash": hash_password(body.password),
        "email_verified": not settings.auth_require_email_verification,
        "default_workspace_id": workspace_id,
        "created_at": now,
        "updated_at": now,
    }
    await repos.users.insert(user)
    if settings.auth_require_email_verification:
        raw = token_urlsafe(24)
        await repos.tokens.insert(
            {
                "_id": new_id("tok"),
                "user_id": user_id,
                "kind": "email_verify",
                "token_hash": hash_token(raw),
                "expires_at": now + timedelta(hours=24),
                "created_at": now,
                "used_at": None,
            }
        )
        from integrations.email_client import email_client

        await email_client.send_email(to=email, subject="Verify your PM Agent account", body="Use your verification link.")
    return await _auth_tokens(repos, user)


async def signin(repos: Repos, body: SignInRequestSchema) -> AuthTokenResponseSchema:
    user = await repos.users.find_by_email(str(body.email).lower())
    if not user:
        raise unauthorized("Invalid email or password")
    if not user.get("password_hash"):
        raise unauthorized("This account uses Gmail. Continue with Gmail instead.")
    if not verify_password(body.password, user["password_hash"]):
        raise unauthorized("Invalid email or password")
    if settings.auth_require_email_verification and not user.get("email_verified"):
        raise unauthorized("Email is not verified")
    return await _auth_tokens(repos, user)


async def google_auth(repos: Repos, body: GoogleAuthRequestSchema) -> AuthTokenResponseSchema:
    from integrations.google_oauth import exchange_auth_code

    identity = await exchange_auth_code(body.code, body.redirect_uri)
    if not identity.email_verified:
        raise unauthorized("Google email is not verified")

    now = utcnow()
    user = await repos.users.find_by_email(identity.email)
    if user:
        await repos.users.update_by_id(
            user["_id"],
            {
                "email_verified": True,
                "google_sub": identity.sub,
                "auth_provider": user.get("auth_provider") or "google",
                "updated_at": now,
            },
        )
        user = await repos.users.find_by_id(user["_id"]) or user
        return await _auth_tokens(repos, user)

    user_id = new_id("usr")
    company = _workspace_name_from_google(identity.name, identity.email, body.company)
    workspace_id = await _seed_workspace(
        repos, user_id=user_id, name=identity.name, email=identity.email, company=company
    )
    user = {
        "_id": user_id,
        "name": identity.name,
        "email": identity.email,
        "password_hash": "",
        "email_verified": True,
        "auth_provider": "google",
        "google_sub": identity.sub,
        "default_workspace_id": workspace_id,
        "created_at": now,
        "updated_at": now,
    }
    await repos.users.insert(user)
    return await _auth_tokens(repos, user)


async def refresh_session(repos: Repos, refresh_token: str) -> AuthTokenResponseSchema:
    tokens = await repos.tokens.find_many({"kind": "refresh", "used_at": None}, limit=50)
    match = None
    for doc in tokens:
        if verify_token_hash(refresh_token, doc["token_hash"]):
            match = doc
            break
    if not match:
        raise unauthorized("Invalid refresh token")
    if _aware(match["expires_at"]) < utcnow():
        raise unauthorized("Refresh token expired")
    await repos.tokens.update_by_id(match["_id"], {"used_at": utcnow()})
    user = await repos.users.find_by_id(match["user_id"])
    if not user:
        raise unauthorized("User not found")
    new_refresh = await _issue_refresh(repos, user["_id"])
    return AuthTokenResponseSchema(
        access_token=create_access_token(
            user_id=user["_id"],
            email=user["email"],
            name=str(user.get("name") or ""),
            workspace_id=str(user.get("default_workspace_id") or ""),
        ),
        refresh_token=new_refresh,
        user=_user_response(user),
    )


async def signout(repos: Repos, user_id: str) -> None:
    tokens = await repos.tokens.find_active(user_id=user_id, kind="refresh")
    now = utcnow()
    for token in tokens:
        await repos.tokens.update_by_id(token["_id"], {"used_at": now})


async def forgot_password(repos: Repos, body: ForgotPasswordRequestSchema) -> None:
    user = await repos.users.find_by_email(str(body.email).lower())
    if not user:
        return
    raw = token_urlsafe(24)
    await repos.tokens.insert(
        {
            "_id": new_id("tok"),
            "user_id": user["_id"],
            "kind": "password_reset",
            "token_hash": hash_token(raw),
            "expires_at": utcnow() + timedelta(hours=2),
            "created_at": utcnow(),
            "used_at": None,
        }
    )
    from integrations.email_client import email_client

    await email_client.send_email(to=user["email"], subject="Reset your password", body="Use your reset link.")


async def reset_password(repos: Repos, body: ResetPasswordRequestSchema) -> None:
    tokens = await repos.tokens.find_many({"kind": "password_reset", "used_at": None}, limit=100)
    match = next((t for t in tokens if verify_token_hash(body.token, t["token_hash"])), None)
    if not match or _aware(match["expires_at"]) < utcnow():
        raise unauthorized("Invalid or expired reset token")
    await repos.users.update_by_id(
        match["user_id"],
        {"password_hash": hash_password(body.password), "updated_at": utcnow()},
    )
    await repos.tokens.update_by_id(match["_id"], {"used_at": utcnow()})


async def verify_email(repos: Repos, body: VerifyEmailRequestSchema) -> None:
    tokens = await repos.tokens.find_many({"kind": "email_verify", "used_at": None}, limit=100)
    match = next((t for t in tokens if verify_token_hash(body.token, t["token_hash"])), None)
    if not match or _aware(match["expires_at"]) < utcnow():
        raise unauthorized("Invalid or expired verification token")
    await repos.users.update_by_id(match["user_id"], {"email_verified": True, "updated_at": utcnow()})
    await repos.tokens.update_by_id(match["_id"], {"used_at": utcnow()})


async def me(repos: Repos, user_id: str) -> UserResponseSchema:
    user = await repos.users.find_by_id(user_id)
    if not user:
        raise unauthorized("User not found")
    return _user_response(user)


async def delete_user_data(repos: Repos, actor: Actor) -> None:
    """COMPLIANCE: right-to-erasure — deletes the user record and membership. Workspace data remains if other members exist."""
    await repos.members.delete_many({"user_id": actor.user_id})
    await repos.tokens.delete_many({"user_id": actor.user_id})
    await repos.users.delete_by_id(actor.user_id)
