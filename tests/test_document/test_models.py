"""
Unit tests for document data models.

Tests schema validation, factory methods, and computed properties.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from nirmantra_ai.document.models import (
    Confidence,
    ExtractionMethod,
    ExtractionResult,
    ExtractionWarning,
    PageContent,
)


class TestPageContent:
    """Tests for the PageContent model."""

    def test_from_text_factory(self) -> None:
        page = PageContent.from_text(
            page_number=1,
            text="Hello world",
            method=ExtractionMethod.DIGITAL,
            confidence=Confidence.HIGH,
        )
        assert page.page_number == 1
        assert page.text == "Hello world"
        assert page.char_count == 11
        assert page.method == ExtractionMethod.DIGITAL
        assert page.confidence == Confidence.HIGH

    def test_empty_text_allowed(self) -> None:
        page = PageContent.from_text(
            page_number=1,
            text="",
            method=ExtractionMethod.OCR,
        )
        assert page.char_count == 0
        assert page.confidence == Confidence.UNKNOWN  # default

    def test_page_number_must_be_positive(self) -> None:
        with pytest.raises(ValidationError):
            PageContent.from_text(
                page_number=0,
                text="test",
                method=ExtractionMethod.DIGITAL,
            )

    def test_serialization_round_trip(self) -> None:
        page = PageContent.from_text(
            page_number=3,
            text="Some extracted text",
            method=ExtractionMethod.OCR,
            confidence=Confidence.MEDIUM,
        )
        data = page.model_dump()
        restored = PageContent.model_validate(data)
        assert restored == page


class TestExtractionWarning:
    """Tests for the ExtractionWarning model."""

    def test_warning_with_page(self) -> None:
        w = ExtractionWarning(
            page=5,
            code="empty_page",
            message="Page 5 yielded no text.",
        )
        assert w.page == 5
        assert w.code == "empty_page"

    def test_warning_without_page(self) -> None:
        w = ExtractionWarning(
            code="file_too_large",
            message="Document exceeds size limit.",
        )
        assert w.page is None


class TestExtractionResult:
    """Tests for the ExtractionResult model."""

    def _make_result(self, **overrides) -> ExtractionResult:
        defaults = dict(
            source_filename="test.pdf",
            source_path="/tmp/test.pdf",
            total_pages=2,
            processed_pages=2,
            method=ExtractionMethod.DIGITAL,
            pages=[
                PageContent.from_text(1, "Page one text", ExtractionMethod.DIGITAL),
                PageContent.from_text(2, "Page two text", ExtractionMethod.DIGITAL),
            ],
        )
        defaults.update(overrides)
        return ExtractionResult(**defaults)

    def test_full_text_concatenation(self) -> None:
        result = self._make_result()
        full = result.full_text
        assert "[Page 1]" in full
        assert "[Page 2]" in full
        assert "Page one text" in full
        assert "Page two text" in full

    def test_full_text_skips_empty_pages(self) -> None:
        result = self._make_result(
            pages=[
                PageContent.from_text(1, "Has text", ExtractionMethod.DIGITAL),
                PageContent.from_text(2, "", ExtractionMethod.DIGITAL),
                PageContent.from_text(3, "Also has text", ExtractionMethod.DIGITAL),
            ],
            total_pages=3,
            processed_pages=3,
        )
        full = result.full_text
        assert "[Page 1]" in full
        assert "[Page 2]" not in full
        assert "[Page 3]" in full

    def test_is_complete_when_all_processed(self) -> None:
        result = self._make_result(total_pages=2, processed_pages=2)
        assert result.is_complete is True

    def test_is_incomplete_when_pages_missing(self) -> None:
        result = self._make_result(total_pages=5, processed_pages=3)
        assert result.is_complete is False

    def test_has_warnings(self) -> None:
        result = self._make_result(
            warnings=[ExtractionWarning(code="test", message="Test warning")]
        )
        assert result.has_warnings is True

    def test_no_warnings(self) -> None:
        result = self._make_result(warnings=[])
        assert result.has_warnings is False

    def test_serialization_round_trip(self) -> None:
        result = self._make_result()
        data = result.model_dump()
        restored = ExtractionResult.model_validate(data)
        assert restored.source_filename == result.source_filename
        assert len(restored.pages) == len(result.pages)

    def test_total_pages_must_be_non_negative(self) -> None:
        with pytest.raises(ValidationError):
            self._make_result(total_pages=-1)
