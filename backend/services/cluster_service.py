from __future__ import annotations

from collections import defaultdict

from core.ids import new_id, utcnow
from models.ticket import ClusterResponseSchema, ClusterTicketRefSchema
from services.context import Actor, Repos, as_id, iso


def to_cluster(doc: dict) -> ClusterResponseSchema:
    data = as_id(doc)
    return ClusterResponseSchema(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        ticket_count=data["ticket_count"],
        affected_code_area=data["affected_code_area"],
        combined_scope=data["combined_scope"],
        representative_quotes=data.get("representative_quotes") or [],
        tickets=[ClusterTicketRefSchema.model_validate(t) for t in data.get("tickets") or []],
        created_at=iso(data.get("created_at")),
    )


def _area(ticket: dict) -> str:
    refs = ticket.get("code_refs") or []
    if not refs:
        return "uncategorized"
    path = refs[0].get("file_path") or "uncategorized"
    parts = path.split("/")
    return "/".join(parts[:2]) if len(parts) > 1 else path


async def rebuild_clusters(repos: Repos, actor: Actor) -> list[ClusterResponseSchema]:
    tickets = await repos.tickets.list_workspace(actor.workspace_id, {"status": "pending"})
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for ticket in tickets:
        groups[(_area(ticket), ticket["classification"])].append(ticket)
    now = utcnow()
    docs = []
    for (area, classification), group in groups.items():
        if len(group) < 2:
            continue
        scopes = {t["scope"] for t in group}
        combined = "L" if "L" in scopes else "M" if "M" in scopes else "S"
        cluster_id = new_id("cl")
        docs.append(
            {
                "_id": cluster_id,
                "workspace_id": actor.workspace_id,
                "title": f"{classification.replace('_', ' ').title()} · {area}",
                "description": f"{len(group)} related pending tickets in {area}",
                "ticket_count": len(group),
                "affected_code_area": area,
                "combined_scope": combined,
                "representative_quotes": [t.get("original_body", "")[:180] for t in group[:3]],
                "tickets": [
                    {
                        "ticket_id": t["_id"],
                        "title": t["draft_title"],
                        "classification": t["classification"],
                        "scope": t["scope"],
                    }
                    for t in group
                ],
                "created_at": now,
            }
        )
        for ticket in group:
            await repos.tickets.update_by_id(ticket["_id"], {"cluster_id": cluster_id})
    await repos.clusters.replace_workspace(actor.workspace_id, docs)
    return [to_cluster(d) for d in docs]


async def list_clusters(repos: Repos, actor: Actor) -> list[ClusterResponseSchema]:
    docs = await repos.clusters.find_many({"workspace_id": actor.workspace_id})
    return [to_cluster(d) for d in docs]


async def get_cluster(repos: Repos, actor: Actor, cluster_id: str) -> ClusterResponseSchema:
    from core.errors import not_found

    doc = await repos.clusters.find_by_id(cluster_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Cluster not found")
    return to_cluster(doc)
