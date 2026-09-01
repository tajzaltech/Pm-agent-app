from __future__ import annotations

import httpx

from core.errors import not_found
from core.ids import new_id, utcnow
from models.ops import (
    DeliveryConfigSchema,
    DeliveryRecordSchema,
    DeliveryRequestSchema,
    DispatchConfigSchema,
    DispatchRecordSchema,
    DispatchRequestSchema,
)
from services.context import Actor, Repos, as_id, iso
from services.pipeline_service import add_from_acceptance


def _cfg(doc: dict) -> DeliveryConfigSchema:
    return DeliveryConfigSchema(
        enabled=doc["enabled"],
        default_tool=doc["default_tool"],
        auto_deliver=doc["auto_deliver"],
        default_assignee_id=doc.get("default_assignee_id") or "",
        tool_webhook_url=doc.get("tool_webhook_url") or "",
        linear_configured=bool(doc.get("linear_api_key")),
        linear_team_id=doc.get("linear_team_id") or "",
        linear_api_key=None,
    )


def _record(doc: dict) -> DeliveryRecordSchema:
    data = as_id(doc)
    return DeliveryRecordSchema(
        ticket_id=data["ticket_id"],
        ticket_title=data["ticket_title"],
        assignee_id=data["assignee_id"],
        assignee_name=data["assignee_name"],
        assignee_initials=data["assignee_initials"],
        tool=data["tool"],
        external_url=data.get("external_url"),
        external_id=data.get("external_id"),
        status=data["status"],
        delivered_at=iso(data.get("delivered_at")),
        error=data.get("error"),
    )


async def get_delivery_config(repos: Repos, actor: Actor) -> DeliveryConfigSchema:
    doc = await repos.delivery_configs.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        doc = {
            "_id": new_id("dcfg"),
            "workspace_id": actor.workspace_id,
            "enabled": False,
            "default_tool": "jira",
            "auto_deliver": False,
            "default_assignee_id": "",
            "tool_webhook_url": "",
            "updated_at": utcnow(),
        }
        await repos.delivery_configs.insert(doc)
    return _cfg(doc)


async def patch_delivery_config(repos: Repos, actor: Actor, patch: dict) -> DeliveryConfigSchema:
    doc = await repos.delivery_configs.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        await get_delivery_config(repos, actor)
        doc = await repos.delivery_configs.find_one({"workspace_id": actor.workspace_id})
    clean = {k: v for k, v in patch.items() if v is not None and k != "linear_configured"}
    if not clean.get("linear_api_key"):
        clean.pop("linear_api_key", None)
    updated = await repos.delivery_configs.update_by_id(doc["_id"], {**clean, "updated_at": utcnow()})
    return _cfg(updated or doc)


async def list_deliveries(repos: Repos, actor: Actor) -> list[DeliveryRecordSchema]:
    docs = await repos.delivery_records.find_many({"workspace_id": actor.workspace_id}, sort=[("delivered_at", -1)])
    return [_record(d) for d in docs]


async def deliver(repos: Repos, actor: Actor, body: DeliveryRequestSchema) -> DeliveryRecordSchema:
    ticket = await repos.tickets.find_by_id(body.ticket_id)
    if not ticket or ticket["workspace_id"] != actor.workspace_id:
        raise not_found("Ticket not found")
    now = utcnow()
    external_id = f"{body.tool.upper()[:3]}-{new_id('x')[-3:]}"
    record = {
        "_id": new_id("del"),
        "workspace_id": actor.workspace_id,
        "ticket_id": body.ticket_id,
        "ticket_title": ticket["draft_title"],
        "assignee_id": body.assignee_id,
        "assignee_name": body.assignee_name,
        "assignee_initials": body.assignee_initials,
        "tool": body.tool,
        "external_url": None,
        "external_id": None,
        "status": "delivered",
        "delivered_at": now,
        "error": None,
    }
    cfg = await repos.delivery_configs.find_one({"workspace_id": actor.workspace_id})
    webhook = (cfg or {}).get("tool_webhook_url") or ""
    if body.tool == "linear" and (cfg or {}).get("linear_api_key"):
        from integrations.linear_client import linear_client

        team_id = (cfg or {}).get("linear_team_id") or ""
        try:
            if not team_id:
                team_id = await linear_client.first_team_id(cfg["linear_api_key"]) or ""
            description = (
                f"{ticket.get('draft_description') or ''}\n\n"
                f"**Approach:** {ticket.get('suggested_approach') or ''}\n\n"
                + "\n".join(f"- {c}" for c in (ticket.get("acceptance_criteria") or []))
            )
            created = await linear_client.create_issue(
                api_key=cfg["linear_api_key"],
                team_id=team_id,
                title=ticket["draft_title"],
                description=description[:12000],
            )
            record["external_id"] = created.get("identifier") or created.get("id")
            record["external_url"] = created.get("url")
            record["status"] = "delivered"
        except Exception as exc:  # noqa: BLE001 — surface provider errors as delivery failure
            record["status"] = "failed"
            record["error"] = str(exc)[:300]
    elif webhook:
        payload = {
            "title": ticket["draft_title"],
            "description": ticket["draft_description"],
            "assignee": body.assignee_name,
            "tool": body.tool,
            "external_id": external_id,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook, json=payload, headers={"User-Agent": "PM-Agent/1.0"})
                if response.status_code >= 400:
                    record["status"] = "failed"
                    record["error"] = f"Webhook returned {response.status_code}"
                else:
                    record["external_id"] = external_id
                    record["external_url"] = webhook
        except httpx.HTTPError:
            record["status"] = "failed"
            record["error"] = "Webhook request failed"
    else:
        record["status"] = "failed"
        record["error"] = "Connect Linear (API key) or set a delivery webhook first"
    await repos.delivery_records.insert(record)
    if record["status"] == "delivered":
        await add_from_acceptance(
            repos,
            actor,
            ticket,
            assignee_name=body.assignee_name,
            tool=body.tool,
        )
        card = await repos.pipeline.find_by_ticket(actor.workspace_id, ticket["_id"])
        if card:
            await repos.pipeline.update_by_id(
                card["_id"],
                {"stage": "assigned", "external_id": record.get("external_id"), "stage_entered_at": now},
            )
    return _record(record)


def _dispatch_cfg(doc: dict) -> DispatchConfigSchema:
    return DispatchConfigSchema(
        enabled=doc["enabled"],
        agent_type=doc["agent_type"],
        webhook_url=doc.get("webhook_url") or "",
        branch_pattern=doc["branch_pattern"],
        custom_branch_pattern=doc.get("custom_branch_pattern") or "",
        include_code_refs=doc.get("include_code_refs", True),
        include_approach=doc.get("include_approach", True),
    )


def _dispatch_record(doc: dict) -> DispatchRecordSchema:
    data = as_id(doc)
    return DispatchRecordSchema(
        ticket_id=data["ticket_id"],
        ticket_title=data["ticket_title"],
        status=data["status"],
        dispatched_at=iso(data.get("dispatched_at")),
        branch_name=data["branch_name"],
        agent_type=data["agent_type"],
        error=data.get("error"),
    )


async def get_dispatch_config(repos: Repos, actor: Actor) -> DispatchConfigSchema:
    doc = await repos.dispatch_configs.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        doc = {
            "_id": new_id("scfg"),
            "workspace_id": actor.workspace_id,
            "enabled": False,
            "agent_type": "claude-code",
            "webhook_url": "",
            "branch_pattern": "fix/{id}",
            "custom_branch_pattern": "",
            "include_code_refs": True,
            "include_approach": True,
            "updated_at": utcnow(),
        }
        await repos.dispatch_configs.insert(doc)
    return _dispatch_cfg(doc)


async def patch_dispatch_config(repos: Repos, actor: Actor, patch: dict) -> DispatchConfigSchema:
    doc = await repos.dispatch_configs.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        await get_dispatch_config(repos, actor)
        doc = await repos.dispatch_configs.find_one({"workspace_id": actor.workspace_id})
    updated = await repos.dispatch_configs.update_by_id(doc["_id"], {**patch, "updated_at": utcnow()})
    return _dispatch_cfg(updated or doc)


async def list_dispatches(repos: Repos, actor: Actor) -> list[DispatchRecordSchema]:
    docs = await repos.dispatch_records.find_many({"workspace_id": actor.workspace_id}, sort=[("dispatched_at", -1)])
    return [_dispatch_record(d) for d in docs]


async def dispatch_ticket(repos: Repos, actor: Actor, ticket_id: str, ticket_title: str | None = None, body: DispatchRequestSchema | None = None) -> DispatchRecordSchema:
    ticket = await repos.tickets.find_by_id(ticket_id)
    if not ticket or ticket["workspace_id"] != actor.workspace_id:
        raise not_found("Ticket not found")
    cfg = await repos.dispatch_configs.find_one({"workspace_id": actor.workspace_id}) or {}
    pattern = (body.branch_name if body and body.branch_name else None) or (
        cfg.get("custom_branch_pattern") if cfg.get("branch_pattern") == "custom" else cfg.get("branch_pattern") or "fix/{id}"
    )
    branch = pattern.replace("{id}", ticket_id)
    webhook = (body.webhook_url if body and body.webhook_url else None) or cfg.get("webhook_url") or ""
    agent_type = (body.agent_type if body and body.agent_type else None) or cfg.get("agent_type") or "claude-code"
    now = utcnow()
    record = {
        "_id": new_id("disp"),
        "workspace_id": actor.workspace_id,
        "ticket_id": ticket_id,
        "ticket_title": ticket_title or ticket["draft_title"],
        "status": "dispatched",
        "dispatched_at": now,
        "branch_name": branch,
        "agent_type": agent_type,
        "error": None,
    }
    if webhook:
        payload = {
            "ticket_id": ticket["_id"],
            "title": ticket["draft_title"],
            "description": ticket["draft_description"],
            "suggested_approach": ticket.get("suggested_approach"),
            "acceptance_criteria": ticket.get("acceptance_criteria"),
            "scope": ticket["scope"],
            "classification": ticket["classification"],
            "code_refs": ticket.get("code_refs") if cfg.get("include_code_refs", True) else [],
            "branch_name": branch,
            "agent_type": agent_type,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook, json=payload, headers={"User-Agent": "PM-Agent/1.0"})
                if response.status_code >= 400:
                    record["status"] = "failed"
                    record["error"] = f"Webhook returned {response.status_code}"
        except httpx.HTTPError:
            record["status"] = "failed"
            record["error"] = "Webhook request failed"
    await repos.dispatch_records.insert(record)
    if record["status"] == "dispatched":
        card = await repos.pipeline.find_by_ticket(actor.workspace_id, ticket_id)
        if card:
            await repos.pipeline.update_by_id(card["_id"], {"stage": "dev_working", "stage_entered_at": now})
    return _dispatch_record(record)
