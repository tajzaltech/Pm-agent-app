from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from statistics import median

from core.ids import utcnow
from models.chat import AiPerformancePointSchema, InsightsOverviewResponseSchema, InsightsSeriesPointSchema
from services.context import Actor, Repos, iso


async def overview(repos: Repos, actor: Actor) -> InsightsOverviewResponseSchema:
    tickets = await repos.tickets.list_workspace(actor.workspace_id)
    week_ago = utcnow() - timedelta(days=7)
    this_week = [t for t in tickets if t["created_at"] >= week_ago]
    accepted = [t for t in tickets if t["status"] == "accepted"]
    rejected = [t for t in tickets if t["status"] == "rejected"]
    decided = [t for t in tickets if t["status"] in {"accepted", "rejected", "ignored"}]
    rate = (len(accepted) / len(decided)) if decided else 0.0
    cards = await repos.pipeline.find_many({"workspace_id": actor.workspace_id})
    cycles = []
    for card in cards:
        if card["stage"] in {"merged", "shipped"}:
            cycles.append(8.0)
    auto = [t for t in accepted if t.get("resolution") == "non_technical"]
    return InsightsOverviewResponseSchema(
        tickets_this_week=len(this_week),
        acceptance_rate=round(rate, 3),
        median_cycle_hours=round(median(cycles), 1) if cycles else 0.0,
        auto_resolved=len(auto),
        hours_saved=round(len(accepted) * 1.5, 1),
        pending=sum(1 for t in tickets if t["status"] == "pending"),
        accepted=len(accepted),
        rejected=len(rejected),
        ignored=sum(1 for t in tickets if t["status"] == "ignored"),
    )


async def series(repos: Repos, actor: Actor) -> list[InsightsSeriesPointSchema]:
    tickets = await repos.tickets.list_workspace(actor.workspace_id)
    buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"processed": 0, "accepted": 0, "rejected": 0})
    for ticket in tickets:
        day = iso(ticket["created_at"])[:10]
        buckets[day]["processed"] += 1
        if ticket["status"] == "accepted":
            buckets[day]["accepted"] += 1
        if ticket["status"] == "rejected":
            buckets[day]["rejected"] += 1
    return [
        InsightsSeriesPointSchema(date=day, **vals)
        for day, vals in sorted(buckets.items())
    ]


async def ai_performance(repos: Repos, actor: Actor) -> list[AiPerformancePointSchema]:
    activity = await repos.activity.list_workspace(actor.workspace_id)
    buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"edits": 0, "overrides": 0, "accepted": 0, "total": 0})
    for entry in activity:
        day = iso(entry["timestamp"])[:10]
        buckets[day]["total"] += 1
        if entry["action"] in {"edited", "edited_accepted"}:
            buckets[day]["edits"] += 1
        if entry["action"] in {"rejected", "ignored"}:
            buckets[day]["overrides"] += 1
        if entry["action"] in {"accepted", "edited_accepted", "accepted_non_technical"}:
            buckets[day]["accepted"] += 1
    out = []
    for day, vals in sorted(buckets.items()):
        total = max(vals["total"], 1)
        out.append(
            AiPerformancePointSchema(
                date=day,
                override_rate=round(vals["overrides"] / total, 3),
                edit_rate=round(vals["edits"] / total, 3),
                acceptance_rate=round(vals["accepted"] / total, 3),
            )
        )
    return out
