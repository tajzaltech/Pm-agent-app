from __future__ import annotations

from core.errors import bad_request, not_found, service_unavailable
from core.ids import new_id, utcnow
from core.config import settings
from integrations.github_client import github_client, language_for
from integrations.pinecone_client import pinecone_client
from integrations.s3_client import s3_client
from integrations.vector_store import chunk_text, make_chunk_doc, upsert_pinecone, vector_store
from models.ops import (
    ProductDocConfirmRequestSchema,
    ProductDocPresignRequestSchema,
    ProductDocPresignResponseSchema,
    ProductDocResponseSchema,
)
from services.context import Actor, Repos, as_id, iso


def to_doc(doc: dict) -> ProductDocResponseSchema:
    data = as_id(doc)
    return ProductDocResponseSchema(
        id=data["id"],
        name=data["name"],
        size=data["size"],
        type=data["type"],
        indexing_status=data.get("indexing_status", "pending"),
        created_at=iso(data.get("created_at")),
    )


async def list_docs(repos: Repos, actor: Actor) -> list[ProductDocResponseSchema]:
    docs = await repos.product_docs.find_many({"workspace_id": actor.workspace_id}, sort=[("created_at", -1)])
    return [to_doc(d) for d in docs]


async def presign(repos: Repos, actor: Actor, body: ProductDocPresignRequestSchema) -> ProductDocPresignResponseSchema:
    if body.content_type not in settings.allowed_upload_type_set:
        raise bad_request("Unsupported file type")
    if body.size_bytes > settings.s3_max_upload_bytes:
        raise bad_request("File exceeds maximum upload size")
    if not s3_client.configured():
        raise service_unavailable("S3 is not configured")
    doc_id = new_id("doc")
    key = f"workspaces/{actor.workspace_id}/docs/{doc_id}/{body.name}"
    url = s3_client.get_presigned_url(
        key=key,
        content_type=body.content_type,
        expires_in=settings.s3_presign_expires_seconds,
    )
    await repos.product_docs.insert(
        {
            "_id": doc_id,
            "workspace_id": actor.workspace_id,
            "name": body.name,
            "size": str(body.size_bytes),
            "type": body.content_type,
            "object_key": key,
            "indexing_status": "pending",
            "created_at": utcnow(),
        }
    )
    return ProductDocPresignResponseSchema(
        upload_url=url,
        object_key=key,
        expires_in=settings.s3_presign_expires_seconds,
        doc_id=doc_id,
    )


async def confirm(repos: Repos, actor: Actor, body: ProductDocConfirmRequestSchema) -> ProductDocResponseSchema:
    doc = await repos.product_docs.find_by_id(body.doc_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Document not found")
    updated = await repos.product_docs.update_by_id(
        body.doc_id,
        {"name": body.name, "size": body.size, "type": body.type, "indexing_status": "indexed"},
    )
    if pinecone_client.configured():
        from integrations.email_client import llm_client

        embedding = await llm_client.embed(body.name)
        if embedding:
            pinecone_client.upsert_vectors(
                [
                    {
                        "id": body.doc_id,
                        "values": embedding,
                        "metadata": {
                            "workspace_id": actor.workspace_id,
                            "kind": "product_doc",
                            "file_path": body.name,
                        },
                    }
                ]
            )
    return to_doc(updated or doc)


async def delete_doc(repos: Repos, actor: Actor, doc_id: str) -> None:
    doc = await repos.product_docs.find_by_id(doc_id)
    if not doc or doc["workspace_id"] != actor.workspace_id:
        raise not_found("Document not found")
    if s3_client.configured() and doc.get("object_key"):
        s3_client.delete_file(key=doc["object_key"])
    if pinecone_client.configured():
        pinecone_client.delete_vectors([doc_id])
    await repos.product_docs.delete_by_id(doc_id)


async def retrieve_chunks(repos: Repos, workspace_id: str, query: str, top_k: int = 6) -> list[dict]:
    from integrations.email_client import llm_client

    embedding = await llm_client.embed(query)
    if not embedding:
        return []
    if pinecone_client.configured():
        matches = pinecone_client.query_vectors(
            embedding,
            top_k=top_k,
            filter={"workspace_id": {"$eq": workspace_id}},
        )
        if matches:
            return matches
    return await vector_store.query(repos.code_chunks.db, workspace_id=workspace_id, embedding=embedding, top_k=top_k)


async def index_repo(repos: Repos, actor: Actor, repo_id: str) -> None:
    repo = await repos.repos.find_by_id(repo_id)
    if not repo or repo["workspace_id"] != actor.workspace_id:
        raise not_found("Repo not found")
    await repos.repos.update_by_id(repo_id, {"status": "indexing"})
    from integrations.email_client import llm_client
    from httpx import HTTPError

    token = repo.get("access_token") or None
    try:
        paths = await github_client.list_source_files(repo["full_name"], token)
    except (HTTPError, ValueError):
        await repos.repos.update_by_id(repo_id, {"status": "error", "last_indexed": utcnow()})
        return

    chunk_payloads: list[tuple[str, int, int, str, str]] = []
    for path in paths:
        try:
            text = await github_client.fetch_file(repo["full_name"], path, token)
        except HTTPError:
            continue
        if not text.strip():
            continue
        lang = language_for(path)
        for start, end, body in chunk_text(text):
            chunk_payloads.append((path, start, end, lang, body))

    docs: list[dict] = []
    batch_size = 16
    for offset in range(0, len(chunk_payloads), batch_size):
        batch = chunk_payloads[offset : offset + batch_size]
        embeddings = await llm_client.embed_many([item[4] for item in batch])
        if len(embeddings) != len(batch):
            continue
        for (path, start, end, lang, body), embedding in zip(batch, embeddings):
            docs.append(
                make_chunk_doc(
                    workspace_id=actor.workspace_id,
                    repo_id=repo_id,
                    file_path=path,
                    language=lang,
                    start=start,
                    end=end,
                    body=body,
                    embedding=embedding,
                )
            )

    await vector_store.replace_repo_chunks(
        repos.code_chunks.db, workspace_id=actor.workspace_id, repo_id=repo_id, chunks=docs
    )
    await upsert_pinecone(docs)
    await repos.repos.update_by_id(
        repo_id,
        {"status": "indexed" if docs else "error", "last_indexed": utcnow(), "chunk_count": len(docs)},
    )
