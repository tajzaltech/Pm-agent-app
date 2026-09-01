from __future__ import annotations

import math
from typing import Any

from core.ids import new_id
from integrations.pinecone_client import pinecone_client


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class MongoVectorStore:
    """Local embedding store. Used when Pinecone is unset. Metadata stores IDs/paths only plus a short snippet."""

    async def replace_repo_chunks(self, db, *, workspace_id: str, repo_id: str, chunks: list[dict[str, Any]]) -> None:
        await db.code_chunks.delete_many({"workspace_id": workspace_id, "repo_id": repo_id})
        if not chunks:
            return
        await db.code_chunks.insert_many(chunks)

    async def delete_repo(self, db, *, workspace_id: str, repo_id: str) -> None:
        await db.code_chunks.delete_many({"workspace_id": workspace_id, "repo_id": repo_id})

    async def query(
        self,
        db,
        *,
        workspace_id: str,
        embedding: list[float],
        top_k: int = 6,
    ) -> list[dict[str, Any]]:
        docs = await db.code_chunks.find({"workspace_id": workspace_id}).to_list(length=2000)
        scored: list[tuple[float, dict[str, Any]]] = []
        for doc in docs:
            vector = doc.get("embedding") or []
            score = cosine(embedding, vector)
            if score > 0.15:
                scored.append((score, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        out = []
        for score, doc in scored[:top_k]:
            out.append(
                {
                    "id": doc.get("_id"),
                    "score": score,
                    "metadata": {
                        "workspace_id": workspace_id,
                        "file_path": doc.get("file_path"),
                        "function_name": doc.get("function_name"),
                        "line_start": doc.get("line_start"),
                        "line_end": doc.get("line_end"),
                        "language": doc.get("language"),
                        "snippet": doc.get("snippet"),
                    },
                }
            )
        return out


def chunk_text(text: str, *, size: int = 1200, overlap: int = 150) -> list[tuple[int, int, str]]:
    lines = text.splitlines()
    chunks: list[tuple[int, int, str]] = []
    buf: list[str] = []
    start = 1
    char_count = 0
    for index, line in enumerate(lines, start=1):
        buf.append(line)
        char_count += len(line) + 1
        if char_count >= size:
            body = "\n".join(buf)
            chunks.append((start, index, body))
            keep = body[-overlap:] if overlap else ""
            buf = keep.splitlines() if keep else []
            start = max(1, index - max(len(buf) - 1, 0))
            char_count = len(keep)
    if buf:
        chunks.append((start, len(lines), "\n".join(buf)))
    return chunks or [(1, max(len(lines), 1), text[:size])]


def make_chunk_doc(
    *,
    workspace_id: str,
    repo_id: str,
    file_path: str,
    language: str,
    start: int,
    end: int,
    body: str,
    embedding: list[float],
) -> dict[str, Any]:
    snippet = body[:500]
    first = next((line.strip() for line in body.splitlines() if line.strip()), "")
    function_name = None
    for token in ("def ", "function ", "async def ", "export function ", "fn "):
        if first.startswith(token):
            function_name = first.replace(token, "").split("(")[0].strip()[:80]
            break
    return {
        "_id": new_id("chk"),
        "workspace_id": workspace_id,
        "repo_id": repo_id,
        "file_path": file_path,
        "function_name": function_name,
        "line_start": start,
        "line_end": end,
        "language": language,
        "snippet": snippet,
        "embedding": embedding,
    }


async def upsert_pinecone(chunks: list[dict[str, Any]]) -> None:
    if not pinecone_client.configured() or not chunks:
        return
    vectors = [
        {
            "id": chunk["_id"],
            "values": chunk["embedding"],
            "metadata": {
                "workspace_id": chunk["workspace_id"],
                "file_path": chunk["file_path"],
                "function_name": chunk.get("function_name") or "",
                "line_start": chunk.get("line_start") or 0,
                "line_end": chunk.get("line_end") or 0,
                "language": chunk.get("language") or "",
            },
        }
        for chunk in chunks
    ]
    pinecone_client.upsert_vectors(vectors)


vector_store = MongoVectorStore()
