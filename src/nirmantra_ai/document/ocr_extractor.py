"""
OCR-based text extractor for scanned documents.

Uses Tesseract (via pytesseract) to extract text from image-based PDFs
or standalone image files. Supports English and Hindi by default.

Requires Tesseract to be installed on the system. If Tesseract is not
available, extraction will raise OcrNotAvailableError.
"""

from __future__ import annotations

import logging
import shutil
from pathlib import Path

import fitz  # PyMuPDF — used to render PDF pages to images
from PIL import Image

from nirmantra_ai.config import get_settings
from nirmantra_ai.document.errors import (
    ExtractionFailedError,
    FileNotFoundError_,
    OcrNotAvailableError,
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

_SUPPORTED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"}
_SUPPORTED_EXTS = {".pdf"} | _SUPPORTED_IMAGE_EXTS

# Minimum OCR confidence threshold (pytesseract returns 0-100 per word).
_LOW_CONFIDENCE_THRESHOLD = 40
_MEDIUM_CONFIDENCE_THRESHOLD = 70

# DPI for rendering PDF pages to images before OCR.
_RENDER_DPI = 300


class OcrExtractor:
    """Extract text from scanned PDFs or images using Tesseract OCR.

    Usage:
        extractor = OcrExtractor()
        result = extractor.extract("path/to/scanned_doc.pdf")
        print(result.full_text)
    """

    def __init__(
        self,
        max_pages: int | None = None,
        languages: str | None = None,
        tesseract_cmd: str | None = None,
    ) -> None:
        """
        Args:
            max_pages: Override the default page limit.
            languages: Tesseract language string (e.g. "eng+hin").
            tesseract_cmd: Path to the Tesseract binary.
        """
        settings = get_settings()
        self._max_pages = max_pages or settings.max_pdf_pages
        self._languages = languages or settings.ocr_languages
        self._tesseract_cmd = tesseract_cmd or settings.tesseract_cmd

        # Defer the pytesseract import so the rest of the package works
        # even if Tesseract is not installed.
        self._pytesseract = self._load_pytesseract()

    def _load_pytesseract(self):  # noqa: ANN202
        """Import and configure pytesseract, or raise if unavailable."""
        try:
            import pytesseract
        except ImportError as exc:
            raise OcrNotAvailableError(
                "pytesseract is not installed. "
                "Install it with: pip install pytesseract"
            ) from exc

        # Verify the Tesseract binary is reachable
        pytesseract.pytesseract.tesseract_cmd = self._tesseract_cmd

        resolved = shutil.which(self._tesseract_cmd)
        if resolved is None:
            raise OcrNotAvailableError(
                f"Tesseract binary not found at: {self._tesseract_cmd}. "
                "Install Tesseract or set TESSERACT_CMD in your .env file."
            )

        logger.info("Tesseract OCR available at: %s", resolved)
        return pytesseract

    # ── Public API ────────────────────────────────────────────────────

    def extract(self, file_path: str | Path) -> ExtractionResult:
        """Extract text from a scanned PDF or image file using OCR.

        Args:
            file_path: Path to the document or image.

        Returns:
            ExtractionResult with per-page content and metadata.

        Raises:
            FileNotFoundError_: If the file does not exist.
            UnsupportedFormatError: If the file type is not supported.
            PageLimitExceededError: If a PDF exceeds max_pages.
            ExtractionFailedError: If OCR fails entirely.
        """
        path = Path(file_path).resolve()
        self._validate_file(path)

        logger.info("Running OCR on: %s", path.name)

        if path.suffix.lower() == ".pdf":
            return self._extract_from_pdf(path)
        else:
            return self._extract_from_image(path)

    # ── Validators ────────────────────────────────────────────────────

    def _validate_file(self, path: Path) -> None:
        if not path.exists():
            raise FileNotFoundError_(str(path))
        if path.suffix.lower() not in _SUPPORTED_EXTS:
            raise UnsupportedFormatError(
                str(path),
                f"Expected one of {sorted(_SUPPORTED_EXTS)}, "
                f"got {path.suffix!r}",
            )

    # ── PDF OCR ───────────────────────────────────────────────────────

    def _extract_from_pdf(self, path: Path) -> ExtractionResult:
        """Render each PDF page to an image, then OCR it."""
        try:
            doc = fitz.open(str(path))
        except Exception as exc:
            raise ExtractionFailedError(str(path), str(exc)) from exc

        try:
            total_pages = len(doc)
            if total_pages > self._max_pages:
                raise PageLimitExceededError(str(path), total_pages, self._max_pages)

            pages: list[PageContent] = []
            warnings: list[ExtractionWarning] = []
            processed = 0

            for page_idx in range(total_pages):
                page_num = page_idx + 1
                try:
                    page = doc[page_idx]
                    # Render page to a high-resolution pixmap
                    mat = fitz.Matrix(_RENDER_DPI / 72, _RENDER_DPI / 72)
                    pix = page.get_pixmap(matrix=mat)
                    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

                    text, confidence = self._ocr_image(img)

                    if not text.strip():
                        warnings.append(ExtractionWarning(
                            page=page_num,
                            code="empty_ocr",
                            message=f"Page {page_num}: OCR produced no text.",
                        ))

                    pages.append(PageContent.from_text(
                        page_number=page_num,
                        text=text.strip(),
                        method=ExtractionMethod.OCR,
                        confidence=confidence,
                    ))
                    processed += 1

                except Exception as exc:
                    logger.warning(
                        "OCR failed on page %d of %s: %s",
                        page_num, path.name, exc,
                    )
                    warnings.append(ExtractionWarning(
                        page=page_num,
                        code="ocr_page_error",
                        message=f"Page {page_num}: {exc}",
                    ))

            return ExtractionResult(
                source_filename=path.name,
                source_path=str(path),
                total_pages=total_pages,
                processed_pages=processed,
                method=ExtractionMethod.OCR,
                pages=pages,
                warnings=warnings,
            )
        finally:
            doc.close()

    # ── Image OCR ─────────────────────────────────────────────────────

    def _extract_from_image(self, path: Path) -> ExtractionResult:
        """OCR a single image file."""
        try:
            img = Image.open(str(path))
        except Exception as exc:
            raise ExtractionFailedError(str(path), str(exc)) from exc

        text, confidence = self._ocr_image(img)
        warnings: list[ExtractionWarning] = []

        if not text.strip():
            warnings.append(ExtractionWarning(
                page=1,
                code="empty_ocr",
                message="OCR produced no text from the image.",
            ))

        page = PageContent.from_text(
            page_number=1,
            text=text.strip(),
            method=ExtractionMethod.OCR,
            confidence=confidence,
        )

        return ExtractionResult(
            source_filename=path.name,
            source_path=str(path),
            total_pages=1,
            processed_pages=1,
            method=ExtractionMethod.OCR,
            pages=[page],
            warnings=warnings,
        )

    # ── Core OCR ──────────────────────────────────────────────────────

    def _ocr_image(self, img: Image.Image) -> tuple[str, Confidence]:
        """Run Tesseract OCR on a PIL Image.

        Returns:
            Tuple of (extracted_text, confidence_level).
        """
        # Get detailed data for confidence assessment
        data = self._pytesseract.image_to_data(
            img,
            lang=self._languages,
            output_type=self._pytesseract.Output.DICT,
        )

        # Compute average word confidence (ignoring empty entries)
        confidences = [
            int(c)
            for c, txt in zip(data["conf"], data["text"])
            if int(c) > 0 and txt.strip()
        ]

        # Also get the plain text
        text = self._pytesseract.image_to_string(
            img,
            lang=self._languages,
        )

        if not confidences:
            return text, Confidence.LOW

        avg_conf = sum(confidences) / len(confidences)

        if avg_conf >= _MEDIUM_CONFIDENCE_THRESHOLD:
            confidence = Confidence.HIGH
        elif avg_conf >= _LOW_CONFIDENCE_THRESHOLD:
            confidence = Confidence.MEDIUM
        else:
            confidence = Confidence.LOW

        logger.debug("OCR average confidence: %.1f → %s", avg_conf, confidence.value)
        return text, confidence
