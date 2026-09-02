from __future__ import annotations

import copy
from typing import Any


def _matches(doc: dict[str, Any], query: dict[str, Any] | None) -> bool:
    if not query:
        return True
    for key, expected in query.items():
        actual = doc.get(key)
        if isinstance(expected, dict):
            if "$in" in expected and actual not in expected["$in"]:
                return False
            if "$ne" in expected and actual == expected["$ne"]:
                return False
            continue
        if actual != expected:
            return False
    return True


class MemoryCursor:
    def __init__(self, docs: list[dict[str, Any]]) -> None:
        self._docs = docs

    def sort(self, keys: list[tuple[str, int]]):
        for field, direction in reversed(keys):
            self._docs.sort(key=lambda d: d.get(field) or 0, reverse=direction < 0)
        return self

    def skip(self, count: int):
        self._docs = self._docs[count:]
        return self

    def limit(self, count: int):
        self._docs = self._docs[:count]
        return self

    async def to_list(self, length: int | None = None) -> list[dict[str, Any]]:
        docs = self._docs if length is None else self._docs[:length]
        return [copy.deepcopy(doc) for doc in docs]


class MemoryCollection:
    def __init__(self) -> None:
        self._docs: list[dict[str, Any]] = []

    def _find_index(self, query: dict[str, Any]) -> int | None:
        for index, doc in enumerate(self._docs):
            if _matches(doc, query):
                return index
        return None

    async def insert_one(self, doc: dict[str, Any]) -> None:
        self._docs.append(copy.deepcopy(doc))

    async def insert_many(self, docs: list[dict[str, Any]]) -> None:
        self._docs.extend(copy.deepcopy(doc) for doc in docs)

    async def find_one(self, query: dict[str, Any] | None = None) -> dict[str, Any] | None:
        index = self._find_index(query or {})
        if index is None:
            return None
        return copy.deepcopy(self._docs[index])

    def find(self, query: dict[str, Any] | None = None) -> MemoryCursor:
        return MemoryCursor([copy.deepcopy(doc) for doc in self._docs if _matches(doc, query)])

    async def count_documents(self, query: dict[str, Any] | None = None) -> int:
        return sum(1 for doc in self._docs if _matches(doc, query))

    async def find_one_and_update(
        self,
        query: dict[str, Any],
        update: dict[str, Any],
        return_document: Any = None,
    ) -> dict[str, Any] | None:
        index = self._find_index(query)
        if index is None:
            return None
        patch = update.get("$set", update)
        self._docs[index].update(patch)
        return copy.deepcopy(self._docs[index])

    async def delete_one(self, query: dict[str, Any]) -> Any:
        index = self._find_index(query)

        class _Result:
            deleted_count = 0 if index is None else 1

        if index is not None:
            del self._docs[index]
        return _Result()

    async def delete_many(self, query: dict[str, Any]) -> Any:
        remaining = [doc for doc in self._docs if not _matches(doc, query)]
        removed = len(self._docs) - len(remaining)
        self._docs = remaining

        class _Result:
            deleted_count = removed

        return _Result()

    async def create_index(self, *args: Any, **kwargs: Any) -> str:
        return "ok"


class MemoryDatabase:
    def __init__(self) -> None:
        self._collections: dict[str, MemoryCollection] = {}

    def __getitem__(self, name: str) -> MemoryCollection:
        if name not in self._collections:
            self._collections[name] = MemoryCollection()
        return self._collections[name]
