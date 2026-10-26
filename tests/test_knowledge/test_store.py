"""
Tests for RegulatoryStore with ChromaDB in ephemeral mode.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    SourceReference,
)
from nirmantra_ai.knowledge.store import RegulatoryStore


@pytest.fixture
def in_memory_store() -> RegulatoryStore:
    return RegulatoryStore(
        collection_name="test_regulatory_collection",
        in_memory=True,
    )


@pytest.fixture
def mock_embedding_client() -> DeterministicMockEmbeddingClient:
    return DeterministicMockEmbeddingClient(dimensions=64)


def test_add_and_count_chunks(
    in_memory_store: RegulatoryStore,
    mock_embedding_client: DeterministicMockEmbeddingClient,
) -> None:
    source = SourceReference(
        document_title="UBBL 2016",
        authority=RegulatoryAuthority.DDA,
        clause_or_section="7.14",
    )
    chunk = RegulatoryChunk(
        chunk_id="test_chunk_1",
        content="Front setback shall be 6.0m for plots above 250 sqm.",
        source=source,
        category=RegulatoryCategory.SETBACK,
    )

    vec = mock_embedding_client.embed_query(chunk.content)
    added = in_memory_store.add_chunks([chunk], [vec])

    assert added == 1
    assert in_memory_store.count() == 1


def test_semantic_query_and_hydration(
    in_memory_store: RegulatoryStore,
    mock_embedding_client: DeterministicMockEmbeddingClient,
) -> None:
    source = SourceReference(
        document_title="UBBL 2016",
        authority=RegulatoryAuthority.DFS,
        clause_or_section="9.3",
    )
    chunk = RegulatoryChunk(
        chunk_id="fire_stair_1",
        content="Fire staircase minimum width 1.25m for residential buildings.",
        source=source,
        category=RegulatoryCategory.FIRE_SAFETY,
        keywords=["staircase", "fire"],
    )

    vec = mock_embedding_client.embed_query(chunk.content)
    in_memory_store.add_chunks([chunk], [vec])

    # Search with matching query
    query_vec = mock_embedding_client.embed_query("residential emergency staircase width")
    matches = in_memory_store.query_semantic(
        query_embedding=query_vec,
        n_results=1,
        category=RegulatoryCategory.FIRE_SAFETY,
    )

    assert len(matches) == 1
    assert matches[0].chunk.chunk_id == "fire_stair_1"
    assert matches[0].chunk.source.authority == RegulatoryAuthority.DFS
    assert matches[0].score > 0.0
    assert matches[0].match_type == "semantic"


def test_get_chunk_by_id(
    in_memory_store: RegulatoryStore,
    mock_embedding_client: DeterministicMockEmbeddingClient,
) -> None:
    source = SourceReference(
        document_title="MPD 2041",
        authority=RegulatoryAuthority.DDA,
        clause_or_section="Zoning 4.2",
    )
    chunk = RegulatoryChunk(
        chunk_id="mpd_zoning_42",
        content="Master plan provisions for mixed use zones.",
        source=source,
        category=RegulatoryCategory.FAR,
    )

    vec = mock_embedding_client.embed_query(chunk.content)
    in_memory_store.add_chunks([chunk], [vec])

    fetched = in_memory_store.get_chunk("mpd_zoning_42")
    assert fetched is not None
    assert fetched.source.document_title == "MPD 2041"
    assert fetched.category == RegulatoryCategory.FAR

    non_existent = in_memory_store.get_chunk("missing_id")
    assert non_existent is None
