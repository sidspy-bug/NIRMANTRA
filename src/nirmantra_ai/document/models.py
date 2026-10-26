"""
Data models for document extraction results.

Every piece of extracted text carries its page number, extraction method,
and a confidence indicator so downstream modules can decide how much to
trust the content.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field


class ExtractionMethod(str, Enum):
    """How text was obtained from the document."""

    DIGITAL = "digital"    # Native text layer in the PDF
    OCR = "ocr"            # Optical character recognition on a scanned page
    MIXED = "mixed"        # Document contained both digital and scanned pages


class Confidence(str, Enum):
    """Qualitative confidence in the extracted content."""

    HIGH = "high"          # Clean digital text or high-quality OCR
    MEDIUM = "medium"      # OCR with minor artefacts
    LOW = "low"            # Poor scan quality, significant noise
    UNKNOWN = "unknown"    # Could not determine quality


class ExtractionWarning(BaseModel):
    """A non-fatal issue encountered during extraction."""

    page: int | None = Field(
        default=None,
        description="1-indexed page number where the issue occurred, if applicable.",
    )
    code: str = Field(
        description="Machine-readable warning code (e.g., 'empty_page', 'low_ocr_confidence').",
    )
    message: str = Field(
        description="Human-readable description of the issue.",
    )


class PageContent(BaseModel):
    """Extracted text from a single page of a document."""

    page_number: int = Field(
        ge=1,
        description="1-indexed page number in the original document.",
    )
    text: str = Field(
        description="Extracted text content. May be empty if the page is blank or unreadable.",
    )
    char_count: int = Field(
        ge=0,
        description="Number of characters extracted from this page.",
    )
    method: ExtractionMethod = Field(
        description="How text was extracted from this page.",
    )
    confidence: Confidence = Field(
        default=Confidence.UNKNOWN,
        description="Qualitative confidence in the extraction quality.",
    )

    @classmethod
    def from_text(
        cls,
        page_number: int,
        text: str,
        method: ExtractionMethod,
        confidence: Confidence = Confidence.UNKNOWN,
    ) -> PageContent:
        """Convenience factory that auto-computes char_count."""
        return cls(
            page_number=page_number,
            text=text,
            char_count=len(text),
            method=method,
            confidence=confidence,
        )


class ExtractionResult(BaseModel):
    """Complete result of extracting text from a document.

    This is the output contract of any document extractor. Downstream
    modules should depend on this schema, not on extractor internals.
    """

    source_filename: str = Field(
        description="Original filename of the processed document.",
    )
    source_path: str = Field(
        description="Absolute or relative path to the processed document.",
    )
    total_pages: int = Field(
        ge=0,
        description="Total number of pages in the original document.",
    )
    processed_pages: int = Field(
        ge=0,
        description="Number of pages successfully processed.",
    )
    method: ExtractionMethod = Field(
        description="Primary extraction method used.",
    )
    pages: list[PageContent] = Field(
        default_factory=list,
        description="Per-page extraction results.",
    )
    warnings: list[ExtractionWarning] = Field(
        default_factory=list,
        description="Non-fatal issues encountered during extraction.",
    )
    extracted_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of when extraction was performed.",
    )

    @property
    def full_text(self) -> str:
        """Concatenated text from all pages, separated by newlines."""
        return "\n\n".join(
            f"[Page {p.page_number}]\n{p.text}"
            for p in self.pages
            if p.text.strip()
        )

    @property
    def is_complete(self) -> bool:
        """True if every page was successfully processed."""
        return self.processed_pages == self.total_pages

    @property
    def has_warnings(self) -> bool:
        return len(self.warnings) > 0


# Semantic alias
DocumentExtractionResult = ExtractionResult
