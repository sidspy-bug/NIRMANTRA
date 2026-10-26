"""
Tests for RegulatoryIngester and default Delhi seed provisions.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.ingest import (
    RegulatoryIngester,
    get_default_delhi_seed_provisions,
)
from nirmantra_ai.knowledge.models import RegulatoryAuthority, RegulatoryCategory
from nirmantra_ai.knowledge.store import RegulatoryStore


@pytest.fixture
def store() -> RegulatoryStore:
    return RegulatoryStore(collection_name="test_ingest_collection", in_memory=True)


@pytest.fixture
def embedding_client() -> DeterministicMockEmbeddingClient:
    return DeterministicMockEmbeddingClient(dimensions=64)


def test_seed_provisions_count_and_content() -> None:
    provisions = get_default_delhi_seed_provisions()
    assert len(provisions) >= 4
    clauses = [p["clause"] for p in provisions]
    assert any("7.14" in c for c in clauses)  # Setbacks
    assert any("Table 7.1" in c for c in clauses)  # FAR & Coverage
    assert any("9.3" in c for c in clauses)  # Fire safety


def test_ingester_raw_provisions(
    store: RegulatoryStore,
    embedding_client: DeterministicMockEmbeddingClient,
) -> None:
    ingester = RegulatoryIngester(store=store, embedding_client=embedding_client)
    raw = [
        {
            "clause": "Rule 10.1",
            "content": "Parking standard for residential plotted plots shall be 2 ECS per 100 sqm.",
            "category": "parking",
        }
    ]

    count = ingester.ingest_raw_provisions(
        provisions=raw,
        document_title="UBBL 2016 Parking Norms",
        authority=RegulatoryAuthority.MCD,
    )

    assert count == 1
    assert store.count() == 1

    chunk = store.get_chunk("ubbl_2016_parki_rule_10_1_0")
    assert chunk is not None
    assert chunk.category == RegulatoryCategory.PARKING
    assert chunk.source.authority == RegulatoryAuthority.MCD
