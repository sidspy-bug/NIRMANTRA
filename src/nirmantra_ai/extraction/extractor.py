"""
High-level building information extractor.

Orchestrates prompt formatting, LLM structured completion,
schema parsing into BuildingInfo, and sanity validation.
"""

from __future__ import annotations

import logging
from typing import Any

from nirmantra_ai.document.models import ExtractionResult
from nirmantra_ai.extraction.client import LLMClient, OpenAILLMClient
from nirmantra_ai.extraction.models import BuildingInfo
from nirmantra_ai.extraction.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    format_extraction_prompt,
)
from nirmantra_ai.extraction.validators import validate_building_info_sanity

logger = logging.getLogger(__name__)


class BuildingInfoExtractor:
    """Extracts structured BuildingInfo from document text using an LLM.

    Usage:
        extractor = BuildingInfoExtractor()  # Uses OpenAILLMClient by default
        info = extractor.extract_from_text(doc_text)
    """

    def __init__(self, llm_client: LLMClient | None = None) -> None:
        """
        Args:
            llm_client: An LLM client implementing the LLMClient protocol.
                        If None, defaults to OpenAILLMClient().
        """
        self._llm = llm_client if llm_client is not None else OpenAILLMClient()

    def extract_from_text(
        self,
        document_text: str,
        source_filename: str | None = None,
    ) -> BuildingInfo:
        """Extract building information from raw text.

        Args:
            document_text: Text content of the building plan or document.
            source_filename: Optional name of the original document.

        Returns:
            Validated BuildingInfo instance with field provenance and audit trail.
        """
        if not document_text.strip():
            logger.warning("Empty document text provided for extraction.")
            info = BuildingInfo(source_filename=source_filename)
            info.extraction_warnings.append("Document text was empty; no features extracted.")
            return info

        user_prompt = format_extraction_prompt(document_text)

        logger.info("Requesting LLM extraction for: %s", source_filename or "raw text")
        raw_json = self._llm.complete_json(
            system_prompt=EXTRACTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        return self._parse_and_validate(raw_json, source_filename)

    def extract(
        self,
        document_text: str,
        project_name: str | None = None,
        source_filename: str | None = None,
    ) -> BuildingInfo:
        """Convenience alias for extract_from_text with optional project_name override."""
        info = self.extract_from_text(document_text, source_filename=source_filename)
        if project_name:
            info.project_name.value = project_name
        return info

    def extract_from_document(
        self,
        extraction_result: ExtractionResult,
    ) -> BuildingInfo:
        """Extract building information from an ExtractionResult (from PDF/OCR).

        Args:
            extraction_result: The result from PdfExtractor or OcrExtractor.

        Returns:
            Validated BuildingInfo instance.
        """
        info = self.extract_from_text(
            document_text=extraction_result.full_text,
            source_filename=extraction_result.source_filename,
        )

        # Propagate any warnings from OCR / document parsing
        for warning in extraction_result.warnings:
            info.extraction_warnings.append(
                f"[Doc Extraction Page {warning.page or 'N/A'}] {warning.message}"
            )

        return info

    def _parse_and_validate(
        self, raw_data: dict[str, Any], source_filename: str | None
    ) -> BuildingInfo:
        """Parse raw JSON dict into BuildingInfo and run sanity validation."""
        try:
            info = BuildingInfo.model_validate(raw_data)
        except Exception as exc:
            logger.error("Failed to parse LLM output into BuildingInfo: %s", exc)
            # Create empty fallback with error recorded
            info = BuildingInfo(source_filename=source_filename)
            info.extraction_warnings.append(f"Model validation error on LLM output: {exc}")
            return info

        info.source_filename = source_filename

        # Non-destructive physical sanity checks
        issues = validate_building_info_sanity(info)
        for issue in issues:
            info.extraction_warnings.append(
                f"[{issue.severity}] {issue.field}: {issue.message}"
            )

        return info
