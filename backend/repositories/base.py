from __future__ import annotations

from typing import Any

from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo import ReturnDocument


class BaseRepository:
    collection_name: str

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.col: AsyncIOMotorCollection = db[self.collection_name]

    async def insert(self, doc: dict[str, Any]) -> dict[str, Any]:
        await self.col.insert_one(doc)
        return doc

    async def find_by_id(self, doc_id: str) -> dict[str, Any] | None:
        return await self.col.find_one({"_id": doc_id})

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        return await self.col.find_one(query)

    async def find_many(
        self,
        query: dict[str, Any],
        *,
        sort: list[tuple[str, int]] | None = None,
        limit: int = 200,
        skip: int = 0,
    ) -> list[dict[str, Any]]:
        cursor = self.col.find(query)
        if sort:
            cursor = cursor.sort(sort)
        return await cursor.skip(skip).limit(limit).to_list(length=limit)

    async def count(self, query: dict[str, Any]) -> int:
        return await self.col.count_documents(query)

    async def update_by_id(self, doc_id: str, patch: dict[str, Any]) -> dict[str, Any] | None:
        return await self.col.find_one_and_update(
            {"_id": doc_id},
            {"$set": patch},
            return_document=ReturnDocument.AFTER,
        )

    async def delete_by_id(self, doc_id: str) -> bool:
        result = await self.col.delete_one({"_id": doc_id})
        return result.deleted_count == 1

    async def delete_many(self, query: dict[str, Any]) -> int:
        result = await self.col.delete_many(query)
        return result.deleted_count
