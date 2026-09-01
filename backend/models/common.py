from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LooseModel(BaseModel):
    """Webhook payloads from vendors include extra fields we do not model."""

    model_config = ConfigDict(extra="allow")


class ORMModel(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class ErrorResponseSchema(StrictModel):
    code: str
    message: str
    details: object | None = None


class OkResponseSchema(StrictModel):
    ok: bool = True


class PaginationQuery(StrictModel):
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class ListResponseSchema(StrictModel, Generic[T]):
    items: list[T]
    total: int
