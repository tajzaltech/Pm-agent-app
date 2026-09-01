from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def utcnow_iso() -> str:
    return utcnow().isoformat().replace("+00:00", "Z")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "CU"
    return "".join(p[0].upper() for p in parts[:2])
