from __future__ import annotations

import re
from typing import Any

from core.ids import initials, new_id, utcnow
from models.ticket import (
    ActivityResponseSchema,
    AttachmentSchema,
    CodeRefSchema,
    ConversationMessageSchema,
    CustomerSchema,
    ReasoningSignalSchema,
    TicketCreateFromChatRequestSchema,
    TicketPatchRequestSchema,
    TicketResponseSchema,
    TicketReviewRequestSchema,
)
from services.context import Actor, Repos, as_id, iso


def classify_text(subject: str, body: str) -> str:
    text = f"{subject} {body}".lower()
    if re.search(r"(cancel|churn|leave|competitor|angry|urgent|audit|compliance)", text):
        return "churn_signal"
    if re.search(r"(bug|error|broken|fail|timeout|crash|loop|not working|double|stuck)", text):
        return "bug"
    if re.search(r"(\bhow\b|\bwhat\b|\bwhere\b|\bcan you\b|\bdocs\b|\?)", text):
        return "question"
    return "feature_request"


def scope_for(classification: str, text: str) -> str:
    lower = text.lower()
    if classification == "churn_signal" or re.search(r"(enterprise|compliance|audit|large|migration)", lower):
        return "L"
    if re.search(r"(api|database|webhook|payment|auth|integration|background|index)", lower):
        return "M"
    return "S"


def _heuristic_code_refs(text: str) -> list[dict[str, Any]]:
    lower = text.lower()
    if re.search(r"(payment|stripe|charge|checkout|webhook)", lower):
        return [
            {
                "id": new_id("cr"),
                "file_path": "src/checkout/webhook_handler.py",
                "function_name": "handle_stripe_event",
                "line_start": 42,
                "line_end": 89,
                "language": "python",
                "snippet": "Matched payment/webhook language in the customer ticket.",
            }
        ]
    if re.search(r"(login|password|sso|auth|reset)", lower):
        return [
            {
                "id": new_id("cr"),
                "file_path": "src/auth/password_reset.py",
                "function_name": "initiate_password_reset",
                "line_start": 15,
                "line_end": 40,
                "language": "python",
            }
        ]
    return [
        {
            "id": new_id("cr"),
            "file_path": "src/app/routes.ts",
            "language": "typescript",
            "snippet": "No exact code match yet. Treat this as a starting reference.",
        }
    ]


async def resolve_code_refs(repos: Repos, workspace_id: str, text: str) -> list[dict[str, Any]]:
    from services.docs_service import retrieve_chunks

    matches = await retrieve_chunks(repos, workspace_id, text)
    refs = []
    for match in matches:
        meta = match.get("metadata") or {}
        path = meta.get("file_path")
        if not path:
            continue
        refs.append(
            {
                "id": new_id("cr"),
                "file_path": path,
                "function_name": meta.get("function_name") or None,
                "line_start": meta.get("line_start") or None,
                "line_end": meta.get("line_end") or None,
                "language": meta.get("language") or None,
                "snippet": (meta.get("snippet") or "")[:400] or None,
            }
        )
    return refs[:4]


def confidence_for(classification: str, code_refs: list[dict[str, Any]]) -> tuple[float, str, list[dict[str, Any]]]:
    score = 0.55
    if classification == "bug":
        score += 0.15
    if len(code_refs) >= 2:
        score += 0.1
    if code_refs and code_refs[0].get("function_name"):
        score += 0.1
    score = min(score, 0.97)
    level = "high" if score >= 0.8 else "medium" if score >= 0.6 else "low"
    signals = [
        {"label": "Classification prior", "detail": f"Labeled as {classification}", "weight": 0.4},
        {"label": "Code match", "detail": f"{len(code_refs)} reference(s)", "weight": 0.6},
    ]
    return score, level, signals


def to_ticket_schema(doc: dict[str, Any]) -> TicketResponseSchema:
    data = as_id(doc)
    customer = data.get("customer") or {}
    return TicketResponseSchema(
        id=data["id"],
        status=data["status"],
        classification=data["classification"],
        scope=data["scope"],
        draft_title=data["draft_title"],
        draft_description=data["draft_description"],
        suggested_approach=data["suggested_approach"],
        acceptance_criteria=data.get("acceptance_criteria") or [],
        scope_rationale=data.get("scope_rationale") or "",
        code_refs=[CodeRefSchema.model_validate(ref) for ref in data.get("code_refs") or []],
        ai_confidence=data.get("ai_confidence"),
        ai_confidence_level=data.get("ai_confidence_level"),
        ai_reasoning=[ReasoningSignalSchema.model_validate(s) for s in data.get("ai_reasoning") or []],
        cluster_id=data.get("cluster_id"),
        priority_score=data.get("priority_score"),
        customer=CustomerSchema.model_validate(customer),
        source=data["source"],
        resolution=data.get("resolution"),
        via_pm_chat=bool(data.get("via_pm_chat")),
        linked_chat_id=data.get("linked_chat_id"),
        original_ticket_id=data["original_ticket_id"],
        original_subject=data["original_subject"],
        original_body=data["original_body"],
        conversation=[ConversationMessageSchema.model_validate(m) for m in data.get("conversation") or []],
        internal_notes=data.get("internal_notes") or "",
        attachments=[AttachmentSchema.model_validate(a) for a in data.get("attachments") or []],
        created_at=iso(data.get("created_at")),
        processing_state=data.get("processing_state"),
    )


def to_activity_schema(doc: dict[str, Any]) -> ActivityResponseSchema:
    data = as_id(doc)
    return ActivityResponseSchema(
        id=data["id"],
        action=data["action"],
        ticket_title=data["ticket_title"],
        ticket_id=data["ticket_id"],
        timestamp=iso(data.get("timestamp")),
    )


async def _log_activity(repos: Repos, actor: Actor, action: str, ticket: dict[str, Any]) -> None:
    now = utcnow()
    await repos.activity.insert(
        {
            "_id": new_id("act"),
            "workspace_id": actor.workspace_id,
            "action": action,
            "ticket_title": ticket["draft_title"],
            "ticket_id": ticket["_id"],
            "timestamp": now,
        }
    )
    await repos.audit.insert(
        {
            "_id": new_id("audit"),
            "workspace_id": actor.workspace_id,
            "action": action,
            "actor": actor.name,
            "actor_user_id": actor.user_id,
            "actor_type": "user",
            "detail": f"{action} · {ticket['draft_title']}",
            "ticket_id": ticket["_id"],
            "ticket_title": ticket["draft_title"],
            "timestamp": now,
        }
    )


def _title_for(classification: str, subject: str) -> str:
    clean = re.sub(r"\s+", " ", subject).strip()
    if not clean:
        return "Review customer request and create engineering follow-up"
    lower = clean[0].lower() + clean[1:]
    if classification == "bug":
        return clean if clean.lower().startswith("fix") else f"Fix {lower}"
    if classification == "feature_request":
        return clean if clean.lower().startswith("add") else f"Add {lower}"
    if classification == "question":
        return clean if clean.lower().startswith("document") else f"Document {lower}"
    return clean if clean.lower().startswith("resolve") else f"Resolve {lower}"


async def build_draft_ticket(
    repos: Repos,
    actor: Actor,
    *,
    provider: str,
    subject: str,
    body: str,
    customer_name: str,
    customer_email: str,
    customer_plan: str = "starter",
    external_id: str | None = None,
    internal_notes: str = "",
    via_pm_chat: bool = False,
    linked_chat_id: str | None = None,
) -> dict[str, Any]:
    text = f"{subject}\n{body}"
    automation = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    auto_classify = True if automation is None else bool(automation.get("auto_classify", True))
    classification = classify_text(subject, body) if auto_classify else "question"
    scope = scope_for(classification, text) if (automation is None or automation.get("scope_estimation", True)) else "M"
    code_refs = await resolve_code_refs(repos, actor.workspace_id, text)
    score, level, signals = confidence_for(classification, code_refs)
    now = utcnow()
    ticket_id = new_id("t")
    return {
        "_id": ticket_id,
        "workspace_id": actor.workspace_id,
        "status": "pending",
        "classification": classification,
        "scope": scope,
        "draft_title": _title_for(classification, subject),
        "draft_description": f"Customer reported: {body[:420]}{'...' if len(body) > 420 else ''}",
        "suggested_approach": (
            f"Start by reviewing {', '.join(r.get('file_path', '') for r in code_refs)}. "
            "Confirm the reproduction path and add the smallest safe fix."
        ),
        "acceptance_criteria": [
            "Issue is reproducible or clearly documented with customer evidence",
            "Relevant implementation area is confirmed by engineering",
            "Fix or documentation update addresses the customer request",
            "Regression test or manual verification notes are added",
        ],
        "scope_rationale": f"{len(code_refs)} likely code reference(s) matched; scope estimated from classification.",
        "code_refs": code_refs,
        "ai_confidence": score,
        "ai_confidence_level": level,
        "ai_reasoning": signals,
        "cluster_id": None,
        "priority_score": score + (0.2 if classification == "churn_signal" else 0),
        "customer": {
            "id": new_id("c"),
            "name": customer_name,
            "email": customer_email,
            "plan": customer_plan if customer_plan in {"starter", "growth", "enterprise"} else "starter",
            "avatar_initials": initials(customer_name),
        },
        "source": provider,
        "resolution": None,
        "via_pm_chat": via_pm_chat,
        "linked_chat_id": linked_chat_id,
        "original_ticket_id": external_id or f"{provider.upper()}-{ticket_id[-5:]}",
        "original_subject": subject,
        "original_body": body,
        "conversation": [
            {
                "id": new_id("msg"),
                "author": customer_name,
                "author_type": "customer",
                "content": body,
                "timestamp": iso(now),
            }
        ],
        "internal_notes": internal_notes or "Created by PM Agent ingestion.",
        "attachments": [],
        "created_at": now,
        "updated_at": now,
        "processing_state": None,
    }


async def list_tickets(repos: Repos, actor: Actor, status: str | None = None) -> tuple[list[TicketResponseSchema], list[ActivityResponseSchema]]:
    query = {"status": status} if status else None
    tickets = await repos.tickets.list_workspace(actor.workspace_id, query)
    activity = await repos.activity.list_workspace(actor.workspace_id)
    return [to_ticket_schema(t) for t in tickets], [to_activity_schema(a) for a in activity]


async def get_ticket(repos: Repos, actor: Actor, ticket_id: str) -> TicketResponseSchema:
    from core.errors import not_found

    ticket = await repos.tickets.find_by_id(ticket_id)
    if not ticket or ticket["workspace_id"] != actor.workspace_id:
        raise not_found("Ticket not found")
    return to_ticket_schema(ticket)


async def create_from_chat(repos: Repos, actor: Actor, body: TicketCreateFromChatRequestSchema) -> TicketResponseSchema:
    ticket = await build_draft_ticket(
        repos,
        actor,
        provider="pm_chat",
        subject=body.title,
        body=body.description,
        customer_name="Chat escalation",
        customer_email="support@workspace.local",
        via_pm_chat=True,
        linked_chat_id=body.chat_session_id,
    )
    ticket["classification"] = body.classification
    ticket["scope"] = body.scope
    ticket["draft_title"] = body.title
    await repos.tickets.insert(ticket)
    await _log_activity(repos, actor, "new_draft", ticket)
    return to_ticket_schema(ticket)


async def patch_ticket(repos: Repos, actor: Actor, ticket_id: str, body: TicketPatchRequestSchema) -> TicketResponseSchema:
    from core.errors import not_found

    ticket = await repos.tickets.find_by_id(ticket_id)
    if not ticket or ticket["workspace_id"] != actor.workspace_id:
        raise not_found("Ticket not found")
    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    patch["updated_at"] = utcnow()
    updated = await repos.tickets.update_by_id(ticket_id, patch)
    await _log_activity(repos, actor, "edited", updated or ticket)
    return to_ticket_schema(updated or ticket)


async def _apply_accept(repos: Repos, actor: Actor, ticket: dict[str, Any], resolution: str) -> dict[str, Any]:
    from services.pipeline_service import add_from_acceptance

    now = utcnow()
    updated = await repos.tickets.update_by_id(
        ticket["_id"],
        {"status": "accepted", "resolution": resolution, "updated_at": now},
    )
    ticket = updated or ticket
    if resolution == "dev":
        await add_from_acceptance(repos, actor, ticket)
        automation = await repos.automation.find_one({"workspace_id": actor.workspace_id})
        if automation and automation.get("auto_dispatch"):
            from services.dispatch_service import dispatch_ticket

            await dispatch_ticket(repos, actor, ticket["_id"], ticket["draft_title"])
    return ticket


async def review_ticket(repos: Repos, actor: Actor, ticket_id: str, body: TicketReviewRequestSchema) -> TicketResponseSchema:
    from core.errors import bad_request, not_found

    ticket = await repos.tickets.find_by_id(ticket_id)
    if not ticket or ticket["workspace_id"] != actor.workspace_id:
        raise not_found("Ticket not found")
    if body.updates:
        patch = {k: v for k, v in body.updates.model_dump().items() if v is not None}
        if patch:
            ticket = await repos.tickets.update_by_id(ticket_id, {**patch, "updated_at": utcnow()}) or ticket
    action = body.action
    if action in {"accept", "accept_non_technical"}:
        resolution = "non_technical" if action == "accept_non_technical" else "dev"
        ticket = await _apply_accept(repos, actor, ticket, resolution)
        log_action = "accepted_non_technical" if resolution == "non_technical" else ("edited_accepted" if body.updates else "accepted")
        await _log_activity(repos, actor, log_action, ticket)
    elif action == "reject":
        ticket = await repos.tickets.update_by_id(ticket_id, {"status": "rejected", "updated_at": utcnow()}) or ticket
        await _log_activity(repos, actor, "rejected", ticket)
    elif action == "ignore":
        ticket = await repos.tickets.update_by_id(ticket_id, {"status": "ignored", "updated_at": utcnow()}) or ticket
        await _log_activity(repos, actor, "ignored", ticket)
    else:
        raise bad_request("Unknown review action")
    return to_ticket_schema(ticket)


async def ingest_source(
    repos: Repos,
    actor: Actor,
    *,
    provider: str,
    subject: str | None,
    body: str | None,
    customer_name: str | None,
    customer_email: str | None,
    customer_plan: str | None,
    external_id: str | None,
    internal_notes: str | None,
) -> tuple[TicketResponseSchema, bool]:
    subj = (subject or "Untitled customer request").strip()
    body_text = (body or "No body was provided.").strip()
    ext = (external_id or "").strip() or f"{provider.upper()}-{new_id('ext')[-5:]}"
    duplicate = await repos.tickets.find_duplicate(actor.workspace_id, provider, ext)
    if duplicate:
        return to_ticket_schema(duplicate), True
    ticket = await build_draft_ticket(
        repos,
        actor,
        provider=provider,
        subject=subj,
        body=body_text,
        customer_name=(customer_name or "Customer").strip(),
        customer_email=(customer_email or "customer@example.com").strip(),
        customer_plan=customer_plan or "starter",
        external_id=ext,
        internal_notes=internal_notes or "",
    )
    await repos.tickets.insert(ticket)
    await _log_activity(repos, actor, "new_draft", ticket)
    automation = await repos.automation.find_one({"workspace_id": actor.workspace_id})
    if automation:
        for rule in automation.get("auto_accept_rules") or []:
            if not rule.get("enabled"):
                continue
            class_ok = rule.get("classification") in {"any", ticket["classification"]}
            scope_ok = rule.get("scope") in {"any", ticket["scope"]}
            if class_ok and scope_ok:
                await review_ticket(
                    repos,
                    actor,
                    ticket["_id"],
                    TicketReviewRequestSchema(action="accept"),
                )
                ticket = await repos.tickets.find_by_id(ticket["_id"]) or ticket
                break
    from services.cluster_service import rebuild_clusters

    await rebuild_clusters(repos, actor)
    return to_ticket_schema(ticket), False
