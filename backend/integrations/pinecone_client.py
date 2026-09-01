from __future__ import annotations

from typing import Any, Protocol


class VectorRecord(dict):
    """Pinecone vector payload. Metadata must not include PII."""


class PineconeClient(Protocol):
    def upsert_vectors(self, vectors: list[dict[str, Any]]) -> None: ...
    def query_vectors(self, vector: list[float], top_k: int = 8, filter: dict | None = None) -> list[dict[str, Any]]: ...
    def delete_vectors(self, ids: list[str]) -> None: ...
    def configured(self) -> bool: ...


class PineconeIntegration:
    def __init__(self) -> None:
        self._index = None

    def configured(self) -> bool:
        from core.config import settings

        return bool(settings.pinecone_api_key and settings.pinecone_index)

    def _index_handle(self):
        if self._index is not None:
            return self._index
        from core.config import settings
        from core.errors import service_unavailable

        if not self.configured():
            raise service_unavailable("Pinecone is not configured")
        from pinecone import Pinecone

        client = Pinecone(api_key=settings.pinecone_api_key)
        self._index = client.Index(settings.pinecone_index)
        return self._index

    def upsert_vectors(self, vectors: list[dict[str, Any]]) -> None:
        from core.config import settings

        if not vectors:
            return
        self._index_handle().upsert(vectors=vectors, namespace=settings.pinecone_namespace)

    def query_vectors(
        self,
        vector: list[float],
        top_k: int = 8,
        filter: dict | None = None,
    ) -> list[dict[str, Any]]:
        from core.config import settings

        result = self._index_handle().query(
            vector=vector,
            top_k=top_k,
            include_metadata=True,
            namespace=settings.pinecone_namespace,
            filter=filter,
        )
        matches = getattr(result, "matches", None) or result.get("matches", [])
        out: list[dict[str, Any]] = []
        for match in matches:
            if hasattr(match, "to_dict"):
                out.append(match.to_dict())
            elif isinstance(match, dict):
                out.append(match)
            else:
                out.append({"id": getattr(match, "id", ""), "score": getattr(match, "score", 0), "metadata": getattr(match, "metadata", {})})
        return out

    def delete_vectors(self, ids: list[str]) -> None:
        from core.config import settings

        if not ids:
            return
        self._index_handle().delete(ids=ids, namespace=settings.pinecone_namespace)


pinecone_client = PineconeIntegration()
