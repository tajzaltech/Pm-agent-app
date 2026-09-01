from __future__ import annotations

from models.enums import PipelineStageOrder
from models.ops import PipelineCardResponseSchema
from core.errors import bad_request, not_found
from core.ids import new_id, utcnow
from services.context import Actor, Repos, as_id, iso


def to_card(doc: dict) -> PipelineCardResponseSchema:
    data = as_id(doc)
    return PipelineCardResponseSchema(
        id=data["id"],
        ticket_id=data["ticket_id"],
        title=data["title"],
        stage=data["stage"],
        assignee_name=data.get("assignee_name"),
        assignee_initials=data.get("assignee_initials"),
        destination_tool=data.get("destination_tool"),
        code_area=data.get("code_area"),
        external_id=data.get("external_id"),
        stage_entered_at=iso(data.get("stage_entered_at")),
    )


async def list_pipeline(repos: Repos, actor: Actor) -> list[PipelineCardResponseSchema]:
    docs = await repos.pipeline.find_many({"workspace_id": actor.workspace_id}, sort=[("stage_entered_at", -1)])
    return [to_card(d) for d in docs]


async def add_from_acceptance(repos: Repos, actor: Actor, ticket: dict, *, assignee_name: str | None = None, tool: str | None = None) -> PipelineCardResponseSchema:
    existing = await repos.pipeline.find_by_ticket(actor.workspace_id, ticket["_id"])
    refs = ticket.get("code_refs") or []
    path = refs[0].get("file_path", "") if refs else ""
    code_area = "/".join(path.split("/")[:2]) if path else "—"
    now = utcnow()
    payload = {
        "workspace_id": actor.workspace_id,
        "ticket_id": ticket["_id"],
        "title": ticket["draft_title"],
        "stage": "assigned" if assignee_name else "accepted",
        "assignee_name": assignee_name,
        "assignee_initials": "".join(p[0] for p in (assignee_name or "").split()[:2]) or None,
        "destination_tool": tool or "Linear",
        "code_area": code_area,
        "external_id": None,
        "stage_entered_at": now,
    }
    if existing:
        updated = await repos.pipeline.update_by_id(existing["_id"], payload)
        return to_card(updated or existing)
    payload["_id"] = new_id("pipe")
    await repos.pipeline.insert(payload)
    return to_card(payload)


async def move_card(repos: Repos, actor: Actor, card_id: str, stage: str) -> PipelineCardResponseSchema:
    card = await repos.pipeline.find_by_id(card_id)
    if not card or card["workspace_id"] != actor.workspace_id:
        raise not_found("Pipeline card not found")
    if stage not in PipelineStageOrder:
        raise bad_request("Invalid pipeline stage")
    updated = await repos.pipeline.update_by_id(card_id, {"stage": stage, "stage_entered_at": utcnow()})
    return to_card(updated or card)


async def advance_card(repos: Repos, actor: Actor, card_id: str) -> PipelineCardResponseSchema:
    card = await repos.pipeline.find_by_id(card_id)
    if not card or card["workspace_id"] != actor.workspace_id:
        raise not_found("Pipeline card not found")
    idx = list(PipelineStageOrder).index(card["stage"]) if card["stage"] in PipelineStageOrder else 0
    if idx < len(PipelineStageOrder) - 1:
        return await move_card(repos, actor, card_id, PipelineStageOrder[idx + 1])
    return to_card(card)
