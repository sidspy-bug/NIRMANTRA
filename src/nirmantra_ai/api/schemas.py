"""
Request and Response DTO schemas for Nirmantra AI REST API.
"""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field

from nirmantra_ai.reporting.models import ComplianceReport


class HealthResponse(BaseModel):
    """Health and runtime diagnostics response."""

    status: str = "healthy"
    app: str = "Nirmaantra AI"
    version: str = "0.1.0"
    jurisdiction: str = "Delhi NCT, India"
    rules_loaded: int = Field(description="Number of active deterministic rules")
    regulations_loaded: int = Field(description="Number of regulatory knowledge chunks indexed")
    llm_provider: str = Field(description="Configured LLM client implementation")
    ocr_available: bool = Field(description="Whether Tesseract OCR is available for scanned images")


class AnalyzeTextRequest(BaseModel):
    """Payload for submitting plain text / drawing schedule for compliance analysis."""

    text: str = Field(
        ...,
        min_length=10,
        description="Architectural submission notes, building drawing schedule, or specification text.",
        examples=[
            "Project: Lotus Heights\nPlot Area: 450 sq.m\nBuilt-up Area: 1100 sq.m\n"
            "Height: 14.5 m\nFront Setback: 6.2 m\nRear Setback: 3.5 m"
        ],
    )
    project_name: str | None = Field(
        default=None,
        description="Optional project name override.",
        examples=["Lotus Heights"],
    )


class RuleMetadataResponse(BaseModel):
    """Metadata describing an active statutory compliance rule."""

    rule_id: str
    name: str
    category: str
    citation: str
    authority: str
    description: str


class RulesListResponse(BaseModel):
    """Response containing all registered statutory rules for Delhi NCT."""

    jurisdiction: str = "Delhi NCT, India"
    total_rules: int
    rules: list[RuleMetadataResponse]


class ErrorResponse(BaseModel):
    """Standard error response format."""

    error: str
    detail: str
    error_type: str


class RegulationUploadResponse(BaseModel):
    """Response returned when new Unified Building Bye-Laws or regulations are uploaded."""

    status: str = "success"
    document_title: str
    authority: str
    chunks_ingested: int
    total_regulations_indexed: int
    categories_detected: list[str]
    message: str


class RegulationSummaryResponse(BaseModel):
    """Summary of loaded building regulations and bye-laws in the knowledge base."""

    jurisdiction: str = "Delhi NCT, India"
    total_chunks: int
    document_titles: list[str]
    authorities: list[str]
    categories: list[str]
    sample_provisions: list[dict[str, Any]]
