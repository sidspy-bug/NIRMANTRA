"""
Unit tests for BuildingInfoExtractor using MockLLMClient.

Tests end-to-end extraction workflow completely offline with zero API calls.
"""

from __future__ import annotations

from nirmantra_ai.document.models import (
    Confidence,
    ExtractionMethod,
    ExtractionResult,
    ExtractionWarning,
    PageContent,
)
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.extraction.extractor import BuildingInfoExtractor
from nirmantra_ai.extraction.models import OccupancyType


class TestBuildingInfoExtractor:
    """Test extractor logic with mock responses."""

    def test_extract_from_text_successful(self) -> None:
        mock_client = MockLLMClient()
        extractor = BuildingInfoExtractor(llm_client=mock_client)

        sample_text = (
            "Building Name: Test Residential Complex\n"
            "Plot Area: 500 sq. m.\n"
            "Total Built-up Area: 1200 sq. m."
        )

        info = extractor.extract_from_text(sample_text, source_filename="plan.pdf")

        assert len(mock_client.call_history) == 1
        assert info.source_filename == "plan.pdf"
        assert info.project_name.value == "Test Residential Complex"
        assert info.plot_area_sqm.value == 500.0
        assert info.total_builtup_area_sqm.value == 1200.0
        assert info.occupancy_type.value == OccupancyType.RESIDENTIAL
        assert info.setbacks.front_m.value == 6.0
        assert info.fire_safety.staircase_width_m.value == 1.2
        assert info.has_critical_dimensions is True

    def test_extract_from_empty_text_returns_safe_defaults(self) -> None:
        mock_client = MockLLMClient()
        extractor = BuildingInfoExtractor(llm_client=mock_client)

        info = extractor.extract_from_text("   ", source_filename="empty.pdf")

        # Should not even call LLM
        assert len(mock_client.call_history) == 0
        assert info.plot_area_sqm.value is None
        assert any("empty" in w.lower() for w in info.extraction_warnings)

    def test_extract_from_document_propagates_document_warnings(self) -> None:
        mock_client = MockLLMClient()
        extractor = BuildingInfoExtractor(llm_client=mock_client)

        doc_result = ExtractionResult(
            source_filename="scanned_plan.pdf",
            source_path="/tmp/scanned_plan.pdf",
            total_pages=2,
            processed_pages=2,
            method=ExtractionMethod.DIGITAL,
            pages=[
                PageContent.from_text(1, "Page 1 text", ExtractionMethod.DIGITAL),
                PageContent.from_text(2, "Page 2 text", ExtractionMethod.DIGITAL),
            ],
            warnings=[
                ExtractionWarning(
                    page=2,
                    code="sparse_text",
                    message="Page 2 has very little text.",
                )
            ],
        )

        info = extractor.extract_from_document(doc_result)

        assert info.source_filename == "scanned_plan.pdf"
        # Warning from the document extraction should be appended
        assert any("Page 2 has very little text" in w for w in info.extraction_warnings)

    def test_handles_malformed_llm_json_gracefully(self) -> None:
        # Override response with bad payload that violates schema types
        bad_response = {
            "plot_area_sqm": "NOT_A_VALID_FIELD_PROVENANCE_OBJECT",
        }
        mock_client = MockLLMClient(response_override=bad_response)
        extractor = BuildingInfoExtractor(llm_client=mock_client)

        info = extractor.extract_from_text("Some text", source_filename="corrupt.pdf")

        assert info.source_filename == "corrupt.pdf"
        assert len(info.extraction_warnings) > 0
        assert any("validation error" in w.lower() for w in info.extraction_warnings)
