from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import auth, product, tickets, webhooks, workspace_ops, workspaces
from core.config import settings
from core.db import close_client


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.is_production and settings.jwt_secret in {
        "replace-with-a-long-random-string",
        "dev-only-change-me",
    }:
        raise RuntimeError("JWT_SECRET must be set to a strong value in production")
    yield
    await close_client()


app = FastAPI(
    title="PM Agent API",
    version="1.0.0",
    description="Backend for PM Agent. Contract: /contracts/openapi.v1.yaml",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.public_origin,
        settings.frontend_origin,
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_prefix
app.include_router(auth.router, prefix=prefix)
app.include_router(workspaces.router, prefix=prefix)
app.include_router(tickets.router, prefix=prefix)
app.include_router(workspace_ops.router, prefix=prefix)
app.include_router(product.router, prefix=prefix)
app.include_router(webhooks.router, prefix=prefix)


@app.get("/health")
async def health():
    mongo = "skipped"
    if settings.on_vercel and settings.mongodb_is_local:
        mongo = "unconfigured"
    else:
        try:
            from core.db import get_client

            await get_client().admin.command("ping")
            mongo = "ok"
        except Exception:
            mongo = "unreachable"
    return {"ok": True, "env": settings.app_env, "mongo": mongo}
