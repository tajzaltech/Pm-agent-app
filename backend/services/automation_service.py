from __future__ import annotations

from core.ids import new_id, utcnow
from models.ops import (
    AutoAcceptRuleCreateRequestSchema,
    AutoAcceptRuleSchema,
    AutomationPatchRequestSchema,
    AutomationResponseSchema,
    PresetRequestSchema,
    RulePreviewRequestSchema,
)
from services.context import Actor, Repos, as_id
from services.ticket_service import to_ticket_schema

PRESETS = {
    "conservative": {
        "auto_classify": True,
        "scope_estimation": True,
        "auto_dispatch": False,
        "auto_accept_rules": [],
    },
    "balanced": {
        "auto_classify": True,
        "scope_estimation": True,
        "auto_dispatch": False,
        "auto_accept_rules": [
            {"id": "preset_qs", "classification": "question", "scope": "S", "enabled": True, "action": "auto_accept"}
        ],
    },
    "aggressive": {
        "auto_classify": True,
        "scope_estimation": True,
        "auto_dispatch": True,
        "auto_accept_rules": [
            {"id": "preset_qs", "classification": "question", "scope": "S", "enabled": True, "action": "auto_accept"},
            {"id": "preset_bug_s", "classification": "bug", "scope": "S", "enabled": True, "action": "auto_accept"},
        ],
    },
}


def _to_schema(doc: dict) -> AutomationResponseSchema:
    data = as_id(doc)
    return AutomationResponseSchema(
        preset=data["preset"],
        auto_classify=data["auto_classify"],
        scope_estimation=data["scope_estimation"],
        auto_dispatch=data["auto_dispatch"],
        auto_accept_rules=[AutoAcceptRuleSchema.model_validate(r) for r in data.get("auto_accept_rules") or []],
    )


async def get_automation(repos: Repos, actor: Actor) -> AutomationResponseSchema:
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    if not doc:
        now = utcnow()
        doc = {
            "_id": new_id("auto"),
            "workspace_id": actor.workspace_id,
            "preset": "balanced",
            **PRESETS["balanced"],
            "updated_at": now,
        }
        await repos.automation.insert(doc)
    return _to_schema(doc)


async def patch_automation(repos: Repos, actor: Actor, body: AutomationPatchRequestSchema) -> AutomationResponseSchema:
    current = await get_automation(repos, actor)
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    patch["updated_at"] = utcnow()
    updated = await repos.automation.update_by_id(doc["_id"], patch)
    return _to_schema(updated or doc)


async def apply_preset(repos: Repos, actor: Actor, body: PresetRequestSchema) -> AutomationResponseSchema:
    cfg = PRESETS[body.preset]
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    patch = {"preset": body.preset, **cfg, "updated_at": utcnow()}
    updated = await repos.automation.update_by_id(doc["_id"], patch)
    await repos.audit.insert(
        {
            "_id": new_id("audit"),
            "workspace_id": actor.workspace_id,
            "action": "preset_applied",
            "actor": actor.name,
            "actor_user_id": actor.user_id,
            "actor_type": "user",
            "detail": f"Applied automation preset {body.preset}",
            "timestamp": utcnow(),
        }
    )
    return _to_schema(updated or doc)


async def add_rule(repos: Repos, actor: Actor, body: AutoAcceptRuleCreateRequestSchema) -> AutomationResponseSchema:
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    rules = list(doc.get("auto_accept_rules") or [])
    rules.append({"id": new_id("rule"), **body.model_dump()})
    updated = await repos.automation.update_by_id(doc["_id"], {"auto_accept_rules": rules, "updated_at": utcnow()})
    return _to_schema(updated or doc)


async def delete_rule(repos: Repos, actor: Actor, rule_id: str) -> AutomationResponseSchema:
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    rules = [r for r in (doc.get("auto_accept_rules") or []) if r.get("id") != rule_id]
    updated = await repos.automation.update_by_id(doc["_id"], {"auto_accept_rules": rules, "updated_at": utcnow()})
    return _to_schema(updated or doc)


async def toggle_rule(repos: Repos, actor: Actor, rule_id: str) -> AutomationResponseSchema:
    doc = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    rules = []
    for rule in doc.get("auto_accept_rules") or []:
        if rule.get("id") == rule_id:
            rule = {**rule, "enabled": not rule.get("enabled", True)}
        rules.append(rule)
    updated = await repos.automation.update_by_id(doc["_id"], {"auto_accept_rules": rules, "updated_at": utcnow()})
    return _to_schema(updated or doc)


async def preview_rule(repos: Repos, actor: Actor, body: RulePreviewRequestSchema):
    tickets = await repos.tickets.list_workspace(actor.workspace_id, {"status": "pending"})
    matched = []
    for ticket in tickets:
        class_ok = body.classification in {"any", ticket["classification"]}
        scope_ok = body.scope in {"any", ticket["scope"]}
        if class_ok and scope_ok:
            matched.append(to_ticket_schema(ticket))
        if len(matched) >= 20:
            break
    return matched
