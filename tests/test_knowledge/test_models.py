"""
Tests for regulatory knowledge base data models and serialization.
"""

from __future__ import annotations

from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    SourceReference,
)


def test_source_reference_defaults() -> None:
    source = SourceReference(
        document_title="Unified Building Bye-Laws for Delhi 2016",
        authority=RegulatoryAuthority.DDA,
        clause_or_section="Clause 7.14",
    )
    assert source.jurisdiction == "Delhi NCT"
    assert source.is_verified is True
    assert source.authority == RegulatoryAuthority.DDA


def test_chunk_to_chroma_metadata_flattens_cleanly() -> None:
    source = SourceReference(
        document_title="UBBL 2016",
        authority=RegulatoryAuthority.DFS,
        clause_or_section="Rule 9.3",
        page_number=45,
        effective_date="2016-03-22",
    )
    chunk = RegulatoryChunk(
        chunk_id="ubbl_9_3",
        content="Emergency staircase shall be 1.25m wide.",
        source=source,
        category=RegulatoryCategory.FIRE_SAFETY,
        keywords=["staircase", "emergency", "fire"],
    )

    meta = chunk.to_chroma_metadata()

    assert meta["chunk_id"] == "ubbl_9_3"
    assert meta["document_title"] == "UBBL 2016"
    assert meta["authority"] == "Delhi Fire Service"
    assert meta["clause_or_section"] == "Rule 9.3"
    assert meta["page_number"] == 45
    assert meta["jurisdiction"] == "Delhi NCT"
    assert meta["category"] == "fire_safety"
    assert "staircase" in meta["keywords"]
