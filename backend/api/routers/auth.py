from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from api.deps import get_current_user, get_repos
from models.auth import (
    AuthTokenResponseSchema,
    ForgotPasswordRequestSchema,
    GoogleAuthRequestSchema,
    MessageResponseSchema,
    RefreshRequestSchema,
    ResetPasswordRequestSchema,
    SignInRequestSchema,
    SignUpRequestSchema,
    UserResponseSchema,
    VerifyEmailRequestSchema,
)
from services import auth_service
from services.context import Repos

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthTokenResponseSchema, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    return await auth_service.signup(repos, body)


@router.post("/signin", response_model=AuthTokenResponseSchema)
async def signin(body: SignInRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    return await auth_service.signin(repos, body)


@router.post("/google", response_model=AuthTokenResponseSchema)
async def google(body: GoogleAuthRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    return await auth_service.google_auth(repos, body)


@router.post("/refresh", response_model=AuthTokenResponseSchema)
async def refresh(body: RefreshRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    return await auth_service.refresh_session(repos, body.refresh_token)


@router.post("/signout", response_model=MessageResponseSchema)
async def signout(user: Annotated[dict, Depends(get_current_user)], repos: Annotated[Repos, Depends(get_repos)]):
    await auth_service.signout(repos, user["_id"])
    return MessageResponseSchema(message="Signed out")


@router.post("/forgot-password", response_model=MessageResponseSchema)
async def forgot_password(body: ForgotPasswordRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    await auth_service.forgot_password(repos, body)
    return MessageResponseSchema(message="If that account exists, a reset email was sent")


@router.post("/reset-password", response_model=MessageResponseSchema)
async def reset_password(body: ResetPasswordRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    await auth_service.reset_password(repos, body)
    return MessageResponseSchema(message="Password updated")


@router.post("/verify-email", response_model=MessageResponseSchema)
async def verify_email(body: VerifyEmailRequestSchema, repos: Annotated[Repos, Depends(get_repos)]):
    await auth_service.verify_email(repos, body)
    return MessageResponseSchema(message="Email verified")


@router.get("/me", response_model=UserResponseSchema)
async def me(user: Annotated[dict, Depends(get_current_user)], repos: Annotated[Repos, Depends(get_repos)]):
    return await auth_service.me(repos, user["_id"])
