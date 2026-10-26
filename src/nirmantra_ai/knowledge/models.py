"""
Data models for regulatory knowledge base storage and retrieval.

Preserves exact legal citations, authority provenance, dates,
and applicability constraints for Delhi NCT.
"""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class RegulatoryAuthority(str, Enum):
    """Regulatory bodies having building jurisdiction in Delhi NCT."""

    DDA = "Delhi Development Authority"
    MCD = "Municipal Corporation of Delhi"
    NDMC = "New Delhi Municipal Council"
    DFS = "Delhi Fire Service"
    DUAC = "Delhi Urban Art Commission"
    NATIONAL = "National (NBC 2016 Applicable to Delhi)"
    UNKNOWN = "Unknown Authority"


class RegulatoryCategory(str, Enum):
    """Compliance categories under Delhi building codes."""

    FAR = "floor_area_ratio"
    GROUND_COVERAGE = "ground_coverage"
    SETBACK = "setback"
    HEIGHT = "building_height"
    FIRE_SAFETY = "fire_safety"
    PARKING = "parking"
    STRUCTURAL = "structural_safety"
    GREEN_BUILDING = "green_building"
    GENERAL = "general"


class SourceReference(BaseModel):
    """Full legal provenance for a regulatory clause or provision."""

    document_title: str = Field(
        description="Official title (e.g., 'Unified Building Bye-Laws for Delhi 2016').",
    )
    authority: RegulatoryAuthority = Field(
        default=RegulatoryAuthority.UNKNOWN,
        description="Issuing regulatory body.",
    )
    clause_or_section: str = Field(
        description="Specific clause, rule, or section identifier (e.g., 'Clause 7.14.1', 'Table 7.1').",
    )
    page_number: int | None = Field(
        default=None,
        ge=1,
        description="1-indexed page number in the official gazette / publication.",
    )
    effective_date: str | None = Field(
        default=None,
        description="Date of notification or coming into force (ISO YYYY-MM-DD or year string).",
    )
    jurisdiction: str = Field(
        default="Delhi NCT",
        description="Geographic jurisdiction scope.",
    )
    is_verified: bool = Field(
        default=True,
        description="True if manually or officially verified against government notifications.",
    )


class RegulatoryChunk(BaseModel):
    """An atomic passage or provision from a regulatory document."""

    chunk_id: str = Field(
        description="Unique identifier for this chunk (e.g., 'ubbl2016_clause_7_14_1_p1').",
    )
    content: str = Field(
        description="Exact text of the regulatory provision.",
    )
    source: SourceReference = Field(
        description="Full legal citation and authority provenance.",
    )
    category: RegulatoryCategory = Field(
        default=RegulatoryCategory.GENERAL,
        description="Primary compliance topic of this chunk.",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Key search terms (e.g., ['staircase', 'refuge area', 'residential']).",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional indexing metadata.",
    )

    def to_chroma_metadata(self) -> dict[str, Any]:
        """Flatten nested source information for ChromaDB metadata storage."""
        return {
            "chunk_id": self.chunk_id,
            "document_title": self.source.document_title,
            "authority": self.source.authority.value,
            "clause_or_section": self.source.clause_or_section,
            "page_number": self.source.page_number or 0,
            "effective_date": self.source.effective_date or "",
            "jurisdiction": self.source.jurisdiction,
            "is_verified": int(self.source.is_verified),
            "category": self.category.value,
            "keywords": ",".join(self.keywords),
        }


class RetrievalMatch(BaseModel):
    """A regulatory chunk returned by search, annotated with score and match type."""

    chunk: RegulatoryChunk
    score: float = Field(
        description="Relevance score (higher is more relevant; range 0.0 to 1.0).",
    )
    match_type: str = Field(
        default="semantic",
        description="Method that matched this chunk: 'semantic', 'keyword', or 'hybrid'.",
    )
