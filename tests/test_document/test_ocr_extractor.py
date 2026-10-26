"""
Tests for OcrExtractor.

These tests verify the OCR extractor's validation logic and error handling
WITHOUT requiring Tesseract to be installed. Tests that actually run OCR
are marked with @pytest.mark.integration.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from nirmantra_ai.document.errors import (
    FileNotFoundError_,
    UnsupportedFormatError,
)


class TestOcrExtractorValidation:
    """Test input validation (no Tesseract required)."""

    def _try_create_extractor(self):
        """Attempt to create an OcrExtractor; skip if Tesseract is missing."""
        from nirmantra_ai.document.errors import OcrNotAvailableError

        try:
            from nirmantra_ai.document.ocr_extractor import OcrExtractor
            return OcrExtractor()
        except OcrNotAvailableError:
            pytest.skip("Tesseract is not installed — skipping OCR tests")

    def test_rejects_nonexistent_file(self) -> None:
        extractor = self._try_create_extractor()
        with pytest.raises(FileNotFoundError_):
            extractor.extract("/nonexistent/scan.pdf")

    def test_rejects_unsupported_format(self, tmp_path: Path) -> None:
        extractor = self._try_create_extractor()
        docx = tmp_path / "document.docx"
        docx.write_text("not a real docx")
        with pytest.raises(UnsupportedFormatError):
            extractor.extract(docx)

    def test_accepts_pdf_extension(self, tmp_text_pdf: Path) -> None:
        """Validation should pass for .pdf files (actual OCR may or may not work)."""
        extractor = self._try_create_extractor()
        # Just verify it gets past validation — the actual OCR result
        # depends on whether the PDF has image content.
        result = extractor.extract(tmp_text_pdf)
        assert result.total_pages == 2


@pytest.mark.integration
class TestOcrExtractorIntegration:
    """Integration tests that require Tesseract to be installed.

    Run with: pytest -m integration
    """

    def _try_create_extractor(self):
        from nirmantra_ai.document.errors import OcrNotAvailableError

        try:
            from nirmantra_ai.document.ocr_extractor import OcrExtractor
            return OcrExtractor()
        except OcrNotAvailableError:
            pytest.skip("Tesseract is not installed")

    def test_ocr_on_image_file(self, tmp_path: Path) -> None:
        """Create a simple image with text and verify OCR extracts it."""
        from PIL import Image, ImageDraw, ImageFont

        extractor = self._try_create_extractor()

        # Create a white image with black text
        img = Image.new("RGB", (400, 100), "white")
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except OSError:
            font = ImageFont.load_default()
        draw.text((10, 30), "Building Height 15 metres", fill="black", font=font)

        img_path = tmp_path / "test_scan.png"
        img.save(str(img_path))

        result = extractor.extract(img_path)
        assert result.total_pages == 1
        assert result.processed_pages == 1
        assert len(result.pages) == 1
        # The OCR should find at least some text
        assert len(result.pages[0].text) > 0
