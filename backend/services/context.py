from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from repositories.collections import (
    ActivityRepository,
    AlertRepository,
    AuditRepository,
    AuthTokenRepository,
    AutomationRepository,
    ChatMessageRepository,
    ChatSessionRepository,
    ClusterRepository,
    CodeChunkRepository,
    ConnectionRepository,
    DeliveryConfigRepository,
    DeliveryRecordRepository,
    DispatchConfigRepository,
    DispatchRecordRepository,
    MemberRepository,
    OnboardingRepository,
    PipelineRepository,
    ProductDocRepository,
    RepoRepository,
    TicketRepository,
    UserRepository,
    WorkspaceRepository,
)


@dataclass
class Repos:
    users: UserRepository
    tokens: AuthTokenRepository
    workspaces: WorkspaceRepository
    members: MemberRepository
    tickets: TicketRepository
    activity: ActivityRepository
    clusters: ClusterRepository
    pipeline: PipelineRepository
    connections: ConnectionRepository
    repos: RepoRepository
    product_docs: ProductDocRepository
    automation: AutomationRepository
    delivery_configs: DeliveryConfigRepository
    delivery_records: DeliveryRecordRepository
    dispatch_configs: DispatchConfigRepository
    dispatch_records: DispatchRecordRepository
    chat_sessions: ChatSessionRepository
    chat_messages: ChatMessageRepository
    alerts: AlertRepository
    audit: AuditRepository
    onboarding: OnboardingRepository
    code_chunks: CodeChunkRepository


def build_repos(db: Any) -> Repos:
    return Repos(
        users=UserRepository(db),
        tokens=AuthTokenRepository(db),
        workspaces=WorkspaceRepository(db),
        members=MemberRepository(db),
        tickets=TicketRepository(db),
        activity=ActivityRepository(db),
        clusters=ClusterRepository(db),
        pipeline=PipelineRepository(db),
        connections=ConnectionRepository(db),
        repos=RepoRepository(db),
        product_docs=ProductDocRepository(db),
        automation=AutomationRepository(db),
        delivery_configs=DeliveryConfigRepository(db),
        delivery_records=DeliveryRecordRepository(db),
        dispatch_configs=DispatchConfigRepository(db),
        dispatch_records=DispatchRecordRepository(db),
        chat_sessions=ChatSessionRepository(db),
        chat_messages=ChatMessageRepository(db),
        alerts=AlertRepository(db),
        audit=AuditRepository(db),
        onboarding=OnboardingRepository(db),
        code_chunks=CodeChunkRepository(db),
    )


@dataclass
class Actor:
    user_id: str
    email: str
    name: str
    workspace_id: str
    role: str


def as_id(doc: dict[str, Any]) -> dict[str, Any]:
    out = dict(doc)
    if "_id" in out and "id" not in out:
        out["id"] = out["_id"]
    return out


def iso(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return value.isoformat().replace("+00:00", "Z")
