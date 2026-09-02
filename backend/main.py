from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import auth, product, tickets, webhooks, workspace_ops, workspaces
from core.config import settings
from core.db import close_client, ensure_indexes, ping_mongo
from integrations.email_client import email_client, llm_client
from integrations.pinecone_client import pinecone_client
from integrations.s3_client import s3_client


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Reload settings from .env on each worker start.
    settings.validate_runtime()
    await ensure_indexes()
    yield
    await close_client()


app = FastAPI(
    title="PM Agent API",
    version="1.0.0",
    description="Backend for PM Agent. Contract: /contracts/openapi.v1.yaml",
    lifespan=lifespan,
    docs_url=None if settings.is_production and not settings.app_debug else "/docs",
    redoc_url=None if settings.is_production and not settings.app_debug else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
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


def _status() -> dict:
    return {
        "ok": True,
        "env": settings.app_env,
        "google": bool(settings.google_client_id and settings.google_client_secret),
        "llm": llm_client.configured(),
        "email": email_client.configured(),
        "s3": s3_client.configured(),
        "pinecone": pinecone_client.configured(),
    }


@app.get("/health")
async def health():
    mongo = "ok" if await ping_mongo() else "unreachable"
    payload = _status()
    payload["mongo"] = mongo
    payload["ok"] = mongo == "ok"
    return payload


@app.get("/ready")
async def ready():
    if not await ping_mongo():
        return JSONResponse(status_code=503, content={"ok": False, "mongo": "unreachable"})
    return {"ok": True, "mongo": "ok"}


@app.exception_handler(Exception)
async def unhandled_error(_request: Request, orig: Exception):
    if isinstance(orig, HTTPException):
        return JSONResponse(status_code=orig.status_code, content={"detail": orig.detail})
    if settings.app_debug:
        raise orig
    return JSONResponse(
        status_code=500,
        content={"detail": {"code": "internal", "message": "Internal server error"}},
    )
