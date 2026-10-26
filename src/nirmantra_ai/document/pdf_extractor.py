"""
Digital PDF text extractor using PyMuPDF (fitz).

Handles natively-digital PDFs where text is embedded in the PDF layer.
For scanned/image-only PDFs, see ocr_extractor.py.
"""

from __future__ import annotations

import logging
from pathlib import Path

import fitz  # PyMuPDF

from nirmantra_ai.config import get_settings
from nirmantra_ai.document.errors import (
    EncryptedPdfError,
    ExtractionFailedError,
    FileNotFoundError_,
    PageLimitExceededError,
    UnsupportedFormatError,
)
from nirmantra_ai.document.models import (
    Confidence,
    ExtractionMethod,
    ExtractionResult,
    ExtractionWarning,
    PageContent,
)

logger = logging.getLogger(__name__)

# Pages with fewer characters than this are flagged as potentially scanned.
_MIN_CHARS_FOR_DIGITAL = 20


class PdfExtractor:
    """Extract text from digital (non-scanned) PDF documents.

    Usage:
        extractor = PdfExtractor()
        result = extractor.extract("path/to/building_plan.pdf")
        print(result.full_text)
    """

    def __init__(self, max_pages: int | None = None) -> None:
        """
        Args:
            max_pages: Override the default page limit from settings.
        """
        self._max_pages = max_pages or get_settings().max_pdf_pages

    def extract(self, file_path: str | Path) -> ExtractionResult:
        """Extract text from a PDF file.

        Args:
            file_path: Path to the PDF document.

        Returns:
            ExtractionResult with per-page content and metadata.

        Raises:
            FileNotFoundError_: If the file does not exist.
            UnsupportedFormatError: If the file is not a PDF.
            EncryptedPdfError: If the PDF is password-protected.
            PageLimitExceededError: If the PDF exceeds max_pages.
            ExtractionFailedError: If extraction fails entirely.
        """
        path = Path(file_path).resolve()
        self._validate_file(path)

        logger.info("Extracting text from PDF: %s", path.name)

        try:
            doc = fitz.open(str(path))
        except Exception as exc:
            raise ExtractionFailedError(str(path), str(exc)) from exc

        try:
            return self._process_document(doc, path)
        finally:
            doc.close()

    def _validate_file(self, path: Path) -> None:
        """Pre-flight checks before opening the PDF."""
        if not path.exists():
            raise FileNotFoundError_(str(path))
        if path.suffix.lower() != ".pdf":
            raise UnsupportedFormatError(
                str(path),
                f"Expected .pdf, got {path.suffix!r}",
            )

    def _process_document(
        self, doc: fitz.Document, path: Path
    ) -> ExtractionResult:
        """Walk through every page and extract text."""
        total_pages = len(doc)

        # Check encryption
        if doc.is_encrypted:
            raise EncryptedPdfError(str(path))

        # Check page limit
        if total_pages > self._max_pages:
            raise PageLimitExceededError(str(path), total_pages, self._max_pages)

        pages: list[PageContent] = []
        warnings: list[ExtractionWarning] = []
        processed = 0

        for page_idx in range(total_pages):
            page_num = page_idx + 1  # 1-indexed
            try:
                page = doc[page_idx]
                text = page.get_text("text") or ""
                text = text.strip()

                confidence = self._assess_confidence(text, page_num)

                if len(text) < _MIN_CHARS_FOR_DIGITAL and text:
                    warnings.append(ExtractionWarning(
                        page=page_num,
                        code="sparse_text",
                        message=(
                            f"Page {page_num} has very little text "
                            f"({len(text)} chars). It may be a scanned "
                            "image requiring OCR."
                        ),
                    ))

                if not text:
                    warnings.append(ExtractionWarning(
                        page=page_num,
                        code="empty_page",
                        message=(
                            f"Page {page_num} yielded no text. It may be "
                            "blank or a scanned image."
                        ),
                    ))

                pages.append(PageContent.from_text(
                    page_number=page_num,
                    text=text,
                    method=ExtractionMethod.DIGITAL,
                    confidence=confidence,
                ))
                processed += 1

            except Exception as exc:
                logger.warning(
                    "Failed to extract page %d from %s: %s",
                    page_num, path.name, exc,
                )
                warnings.append(ExtractionWarning(
                    page=page_num,
                    code="page_extraction_error",
                    message=f"Page {page_num}: {exc}",
                ))

        logger.info(
            "Extracted %d/%d pages from %s (%d warnings)",
            processed, total_pages, path.name, len(warnings),
        )

        return ExtractionResult(
            source_filename=path.name,
            source_path=str(path),
            total_pages=total_pages,
            processed_pages=processed,
            method=ExtractionMethod.DIGITAL,
            pages=pages,
            warnings=warnings,
        )

    @staticmethod
    def _assess_confidence(text: str, page_num: int) -> Confidence:
        """Heuristic confidence based on extracted text characteristics."""
        if not text:
            return Confidence.LOW
        if len(text) < _MIN_CHARS_FOR_DIGITAL:
            return Confidence.MEDIUM
        return Confidence.HIGH
