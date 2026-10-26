"""
Vector store implementation using ChromaDB for regulatory knowledge.

Supports persistent and ephemeral (in-memory) modes, rich metadata filtering,
and round-trip serialization between RegulatoryChunk and Chroma records.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import chromadb
from chromadb.api.models.Collection import Collection

from nirmantra_ai.config import get_settings
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    RetrievalMatch,
    SourceReference,
)

logger = logging.getLogger(__name__)


class RegulatoryStore:
    """Manages indexing and vector queries over regulatory provisions using ChromaDB."""

    def __init__(
        self,
        collection_name: str | None = None,
        persist_dir: str | Path | None = None,
        in_memory: bool = False,
    ) -> None:
        """
        Args:
            collection_name: Name of the Chroma collection.
            persist_dir: Path for on-disk persistence. If in_memory=True, this is ignored.
            in_memory: If True, uses Chroma's EphemeralClient (ideal for tests).
        """
        settings = get_settings()
        self.collection_name = collection_name or settings.chroma_collection

        if in_memory:
            self._client = chromadb.EphemeralClient()
        else:
            resolved_dir = str(persist_dir or settings.chroma_persist_path)
            Path(resolved_dir).mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(path=resolved_dir)

        self._collection: Collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Delhi NCT Building Regulations and Byelaws"},
        )
        logger.info(
            "RegulatoryStore initialized (collection=%r, in_memory=%s, existing_items=%d)",
            self.collection_name,
            in_memory,
            self._collection.count(),
        )

    def count(self) -> int:
        """Return total number of indexed regulatory chunks."""
        return self._collection.count()

    def add_chunks(
        self,
        chunks: list[RegulatoryChunk],
        embeddings: list[list[float]],
    ) -> int:
        """Index a batch of regulatory chunks with their pre-computed embeddings.

        Args:
            chunks: List of RegulatoryChunk models.
            embeddings: Corresponding vector embeddings.

        Returns:
            Number of chunks indexed.
        """
        if not chunks:
            return 0

        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks but {len(embeddings)} embeddings provided."
            )

        ids = [c.chunk_id for c in chunks]
        documents = [c.content for c in chunks]
        metadatas = [c.to_chroma_metadata() for c in chunks]

        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

        logger.info("Indexed %d chunks into %s", len(chunks), self.collection_name)
        return len(chunks)

    def query_semantic(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        category: RegulatoryCategory | None = None,
        authority: RegulatoryAuthority | None = None,
    ) -> list[RetrievalMatch]:
        """Perform vector similarity search against indexed regulatory provisions.

        Args:
            query_embedding: The vector representation of the query.
            n_results: Maximum matches to return.
            category: Optional category filter.
            authority: Optional issuing authority filter.

        Returns:
            List of RetrievalMatch objects with scores and chunks.
        """
        where_filter: dict[str, Any] = {}
        conditions = []

        if category is not None:
            conditions.append({"category": category.value})
        if authority is not None:
            conditions.append({"authority": authority.value})

        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}

        total_available = self.count()
        if total_available == 0:
            return []

        limit = min(n_results, total_available)

        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where=where_filter if where_filter else None,
            include=["documents", "metadatas", "distances"],
        )

        matches: list[RetrievalMatch] = []
        if not results["ids"] or not results["ids"][0]:
            return matches

        ids = results["ids"][0]
        docs = results["documents"][0] if results["documents"] else []
        metas = results["metadatas"][0] if results["metadatas"] else []
        distances = results["distances"][0] if results["distances"] else []

        for chunk_id, doc, meta, dist in zip(ids, docs, metas, distances):
            # Chroma distances: convert distance to similarity score in [0.0, 1.0]
            # When using cosine/L2 distance, similarity = 1 / (1 + distance)
            score = round(1.0 / (1.0 + max(0.0, dist)), 4)
            chunk = self._reconstruct_chunk(chunk_id, doc, meta)
            matches.append(
                RetrievalMatch(
                    chunk=chunk,
                    score=score,
                    match_type="semantic",
                )
            )

        return matches

    def get_chunk(self, chunk_id: str) -> RegulatoryChunk | None:
        """Fetch a specific chunk by its ID."""
        record = self._collection.get(
            ids=[chunk_id],
            include=["documents", "metadatas"],
        )
        if not record["ids"]:
            return None
        return self._reconstruct_chunk(
            record["ids"][0],
            record["documents"][0],
            record["metadatas"][0],
        )

    def get_all_chunks(self, limit: int = 200) -> list[RegulatoryChunk]:
        """Fetch all stored chunks up to limit for introspection or diagnostics."""
        total = self.count()
        if total == 0:
            return []
        fetch_limit = min(limit, total)
        records = self._collection.get(
            include=["documents", "metadatas"],
            limit=fetch_limit,
        )
        if not records["ids"]:
            return []
        chunks: list[RegulatoryChunk] = []
        for cid, doc, meta in zip(records["ids"], records["documents"], records["metadatas"]):
            chunks.append(self._reconstruct_chunk(cid, doc, meta))
        return chunks

    def _reconstruct_chunk(
        self, chunk_id: str, content: str, meta: dict[str, Any]
    ) -> RegulatoryChunk:
        """Hydrate a RegulatoryChunk from ChromaDB storage row."""
        keywords_str = meta.get("keywords", "")
        keywords = [k.strip() for k in keywords_str.split(",") if k.strip()]

        source = SourceReference(
            document_title=meta.get("document_title", "Unknown"),
            authority=RegulatoryAuthority(meta.get("authority", RegulatoryAuthority.UNKNOWN.value)),
            clause_or_section=meta.get("clause_or_section", "N/A"),
            page_number=meta.get("page_number") or None,
            effective_date=meta.get("effective_date") or None,
            jurisdiction=meta.get("jurisdiction", "Delhi NCT"),
            is_verified=bool(meta.get("is_verified", 1)),
        )

        category = RegulatoryCategory(meta.get("category", RegulatoryCategory.GENERAL.value))

        return RegulatoryChunk(
            chunk_id=chunk_id,
            content=content,
            source=source,
            category=category,
            keywords=keywords,
        )
