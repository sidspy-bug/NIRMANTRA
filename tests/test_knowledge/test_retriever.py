"""
Tests for HybridRetriever combining semantic and keyword matching.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.ingest import (
    RegulatoryIngester,
    get_default_delhi_seed_provisions,
)
from nirmantra_ai.knowledge.models import RegulatoryAuthority, RegulatoryCategory
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.knowledge.store import RegulatoryStore


@pytest.fixture
def populated_store() -> tuple[RegulatoryStore, DeterministicMockEmbeddingClient]:
    store = RegulatoryStore(collection_name="test_retriever_collection", in_memory=True)
    embedder = DeterministicMockEmbeddingClient(dimensions=64)
    ingester = RegulatoryIngester(store=store, embedding_client=embedder)

    seeds = get_default_delhi_seed_provisions()
    ingester.ingest_raw_provisions(
        provisions=seeds,
        document_title="Unified Building Bye-Laws for Delhi 2016",
        authority=RegulatoryAuthority.DDA,
    )
    return store, embedder


def test_empty_query_returns_empty(
    populated_store: tuple[RegulatoryStore, DeterministicMockEmbeddingClient],
) -> None:
    store, embedder = populated_store
    retriever = HybridRetriever(store=store, embedding_client=embedder)

    results = retriever.retrieve("   ")
    assert len(results) == 0


def test_retrieves_relevant_setback_provisions(
    populated_store: tuple[RegulatoryStore, DeterministicMockEmbeddingClient],
) -> None:
    store, embedder = populated_store
    retriever = HybridRetriever(store=store, embedding_client=embedder)

    results = retriever.retrieve(
        query="minimum front and rear setback for residential plot",
        n_results=2,
    )

    assert len(results) > 0
    top = results[0]
    assert top.score > 0.0
    # Must preserve exact legal citation
    assert top.chunk.source.document_title == "Unified Building Bye-Laws for Delhi 2016"
    assert top.chunk.source.jurisdiction == "Delhi NCT"
    assert top.match_type in {"semantic", "keyword", "hybrid"}


def test_category_filter_in_retrieval(
    populated_store: tuple[RegulatoryStore, DeterministicMockEmbeddingClient],
) -> None:
    store, embedder = populated_store
    retriever = HybridRetriever(store=store, embedding_client=embedder)

    results = retriever.retrieve(
        query="emergency requirements",
        n_results=3,
        category=RegulatoryCategory.FIRE_SAFETY,
    )

    assert len(results) > 0
    for r in results:
        assert r.chunk.category == RegulatoryCategory.FIRE_SAFETY
