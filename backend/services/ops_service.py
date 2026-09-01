from __future__ import annotations

from core.errors import not_found
from core.ids import utcnow
from models.ops import AlertResponseSchema, AuditLogResponseSchema
from services.context import Actor, Repos, as_id, iso


def to_alert(doc: dict) -> AlertResponseSchema:
    data = as_id(doc)
    return AlertResponseSchema(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        ticket_ids=data.get("ticket_ids") or [],
        cluster_id=data.get("cluster_id"),
        severity=data["severity"],
        created_at=iso(data.get("created_at")),
        dismissed=bool(data.get("dismissed")),
        snoozed_until=iso(data["snoozed_until"]) if data.get("snoozed_until") else None,
    )


async def list_alerts(repos: Repos, actor: Actor) -> list[AlertResponseSchema]:
    docs = await repos.alerts.find_many({"workspace_id": actor.workspace_id}, sort=[("created_at", -1)])
    return [to_alert(d) for d in docs]


async def dismiss_alert(repos: Repos, actor: Actor, alert_id: str) -> AlertResponseSchema:
    doc = await repos.alerts.find_by_id(alert_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Alert not found")
    updated = await repos.alerts.update_by_id(alert_id, {"dismissed": True})
    return to_alert(updated or doc)


async def list_audit(repos: Repos, actor: Actor, query: str = "") -> list[AuditLogResponseSchema]:
    docs = await repos.audit.find_many({"workspace_id": actor.workspace_id}, sort=[("timestamp", -1)], limit=200)
    q = query.lower().strip()
    out = []
    for doc in docs:
        data = as_id(doc)
        hay = " ".join(
            [
                data.get("action", ""),
                data.get("actor", ""),
                data.get("detail", ""),
                data.get("ticket_title") or "",
            ]
        ).lower()
        if q and q not in hay:
            continue
        out.append(
            AuditLogResponseSchema(
                id=data["id"],
                action=data["action"],
                actor=data["actor"],
                actor_type=data["actor_type"],
                detail=data["detail"],
                ticket_id=data.get("ticket_id"),
                ticket_title=data.get("ticket_title"),
                timestamp=iso(data.get("timestamp")),
            )
        )
    return out
