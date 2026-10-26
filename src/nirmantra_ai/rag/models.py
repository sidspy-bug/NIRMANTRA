"""
Data models for Retrieval-Augmented Generation (RAG) and grounded explanations.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from nirmantra_ai.compliance.models import RuleStatus


class CitationDetail(BaseModel):
    """Detailed metadata for a statutory citation grounded in retrieved UBBL provisions."""

    citation: str = Field(description="Formatted legal citation string (e.g. 'UBBL 2016 Clause 7.14.1').")
    authority: str = Field(default="Delhi Development Authority", description="Issuing authority.")
    clause_or_section: str = Field(default="", description="Specific clause or section reference.")
    page_number: int | None = Field(default=None, description="Page number if available.")
    excerpt: str = Field(default="", description="Relevant passage snippet from the bye-law.")
    relevance_score: float | None = Field(default=None, description="Relevance or retrieval score.")


class GroundedFinding(BaseModel):
    """An individual compliance finding explained in natural language with statutory citations."""

    rule_id: str = Field(description="Identifier of the evaluated rule.")
    rule_name: str = Field(description="Title of the requirement.")
    status: RuleStatus = Field(description="Deterministic status (PASS, FAIL, NEEDS_REVIEW, NOT_APPLICABLE).")
    explanation: str = Field(description="Clear explanation grounded in retrieved regulations and measured facts.")
    regulatory_citations: list[str] = Field(
        default_factory=list,
        description="Statutory citations and bye-law clauses supporting this finding.",
    )
    next_steps: list[str] = Field(
        default_factory=list,
        description="Recommended actionable remediation or documentation steps.",
    )
    requires_human_review: bool = Field(
        default=False,
        description="Flag indicating human architect/engineer review is mandatory.",
    )
    missing_evidence: list[str] = Field(
        default_factory=list,
        description="Specific parameters missing from documents that prevented conclusive verification.",
    )
    retrieved_excerpts: list[str] = Field(
        default_factory=list,
        description="Statutory text passages retrieved from Unified Building Bye-Laws supporting this finding.",
    )
    citation_details: list[CitationDetail] = Field(
        default_factory=list,
        description="Structured citation metadata with issuing authorities, clauses, and excerpts.",
    )
