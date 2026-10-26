"""
Hybrid retriever for regulatory provisions.

Combines vector similarity search with lexical/keyword matching to guarantee
exact statutory rule lookups as well as semantic topical discovery.
"""

from __future__ import annotations

import logging
from typing import Sequence

from nirmantra_ai.knowledge.embeddings import EmbeddingClient
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    RetrievalMatch,
)
from nirmantra_ai.knowledge.store import RegulatoryStore

logger = logging.getLogger(__name__)


class HybridRetriever:
    """Retrieves relevant regulatory clauses using combined semantic and keyword ranking."""

    def __init__(
        self,
        store: RegulatoryStore,
        embedding_client: EmbeddingClient,
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
    ) -> None:
        """
        Args:
            store: Indexed RegulatoryStore.
            embedding_client: Embedding model client.
            semantic_weight: Weight given to semantic similarity in rank fusion (0.0 to 1.0).
            keyword_weight: Weight given to lexical token overlap in rank fusion.
        """
        self.store = store
        self.embedding_client = embedding_client
        self.semantic_weight = semantic_weight
        self.keyword_weight = keyword_weight

    def retrieve(
        self,
        query: str,
        n_results: int = 5,
        category: RegulatoryCategory | None = None,
        authority: RegulatoryAuthority | None = None,
    ) -> list[RetrievalMatch]:
        """Retrieve the top-N regulatory provisions matching the query.

        Args:
            query: Plain English search query (e.g., 'residential staircase width for 15m building').
            n_results: Number of top provisions to return.
            category: Optional category constraint (e.g., FIRE_SAFETY).
            authority: Optional authority constraint (e.g., DFS).

        Returns:
            Ranked list of RetrievalMatch objects with combined scores and source citations.
        """
        if not query.strip() or self.store.count() == 0:
            return []

        # 1. Semantic retrieval
        query_embedding = self.embedding_client.embed_query(query)
        semantic_matches = self.store.query_semantic(
            query_embedding=query_embedding,
            n_results=n_results * 2,
            category=category,
            authority=authority,
        )

        # 2. Lexical / Keyword retrieval
        keyword_matches = self._lexical_search(
            query=query,
            n_results=n_results * 2,
            category=category,
            authority=authority,
        )

        # 3. Hybrid fusion & deduplication
        return self._fuse_results(
            semantic_matches=semantic_matches,
            keyword_matches=keyword_matches,
            n_results=n_results,
        )

    def _lexical_search(
        self,
        query: str,
        n_results: int,
        category: RegulatoryCategory | None,
        authority: RegulatoryAuthority | None,
    ) -> list[RetrievalMatch]:
        """Perform simple BM25-like lexical matching against cached store items."""
        query_terms = set(query.lower().split())
        if not query_terms:
            return []

        # Fetch records from store
        records = self.store._collection.get(
            include=["documents", "metadatas"],
        )
        if not records["ids"]:
            return []

        scored_chunks: list[tuple[float, RegulatoryChunk]] = []

        for chunk_id, doc, meta in zip(
            records["ids"], records["documents"], records["metadatas"]
        ):
            # Apply category/authority filters
            if category and meta.get("category") != category.value:
                continue
            if authority and meta.get("authority") != authority.value:
                continue

            doc_lower = doc.lower()
            keywords_str = meta.get("keywords", "").lower()

            # Count term hits in content and keywords
            hits = sum(1 for term in query_terms if term in doc_lower or term in keywords_str)
            if hits > 0:
                score = min(1.0, round(hits / len(query_terms), 4))
                chunk = self.store._reconstruct_chunk(chunk_id, doc, meta)
                scored_chunks.append((score, chunk))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        return [
            RetrievalMatch(chunk=chunk, score=score, match_type="keyword")
            for score, chunk in scored_chunks[:n_results]
        ]

    def _fuse_results(
        self,
        semantic_matches: Sequence[RetrievalMatch],
        keyword_matches: Sequence[RetrievalMatch],
        n_results: int,
    ) -> list[RetrievalMatch]:
        """Blend semantic and keyword scores with Reciprocal Rank / Weighted Fusion."""
        fused_map: dict[str, dict] = {}

        # Track semantic scores
        for m in semantic_matches:
            cid = m.chunk.chunk_id
            fused_map[cid] = {
                "chunk": m.chunk,
                "sem_score": m.score,
                "kw_score": 0.0,
                "matched_by": "semantic",
            }

        # Track keyword scores
        for m in keyword_matches:
            cid = m.chunk.chunk_id
            if cid in fused_map:
                fused_map[cid]["kw_score"] = m.score
                fused_map[cid]["matched_by"] = "hybrid"
            else:
                fused_map[cid] = {
                    "chunk": m.chunk,
                    "sem_score": 0.0,
                    "kw_score": m.score,
                    "matched_by": "keyword",
                }

        results: list[RetrievalMatch] = []
        for cid, data in fused_map.items():
            combined_score = round(
                (data["sem_score"] * self.semantic_weight)
                + (data["kw_score"] * self.keyword_weight),
                4,
            )
            results.append(
                RetrievalMatch(
                    chunk=data["chunk"],
                    score=combined_score,
                    match_type=data["matched_by"],
                )
            )

        # Sort by combined score descending
        results.sort(key=lambda r: r.score, reverse=True)
        return results[:n_results]
