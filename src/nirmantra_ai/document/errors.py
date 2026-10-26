"""
Custom exceptions for the document processing module.

Using specific exception types lets callers distinguish between
recoverable issues (e.g., a single bad page) and fatal errors
(e.g., file not found, encrypted PDF).
"""

from __future__ import annotations


class DocumentError(Exception):
    """Base exception for all document processing errors."""


class FileNotFoundError_(DocumentError):
    """The specified document file does not exist."""

    def __init__(self, path: str) -> None:
        self.path = path
        super().__init__(f"Document not found: {path}")


class UnsupportedFormatError(DocumentError):
    """The file format is not supported by the extractor."""

    def __init__(self, path: str, detail: str = "") -> None:
        self.path = path
        msg = f"Unsupported document format: {path}"
        if detail:
            msg += f" ({detail})"
        super().__init__(msg)


class EncryptedPdfError(DocumentError):
    """The PDF is password-protected and cannot be processed."""

    def __init__(self, path: str) -> None:
        self.path = path
        super().__init__(f"PDF is encrypted/password-protected: {path}")


class ExtractionFailedError(DocumentError):
    """Text extraction failed entirely (not a partial/per-page issue)."""

    def __init__(self, path: str, reason: str) -> None:
        self.path = path
        self.reason = reason
        super().__init__(f"Extraction failed for {path}: {reason}")


class OcrNotAvailableError(DocumentError):
    """Tesseract OCR is not installed or not reachable."""

    def __init__(self, detail: str = "") -> None:
        msg = "Tesseract OCR is not available"
        if detail:
            msg += f": {detail}"
        super().__init__(msg)


class PageLimitExceededError(DocumentError):
    """The document exceeds the configured maximum page count."""

    def __init__(self, path: str, page_count: int, limit: int) -> None:
        self.path = path
        self.page_count = page_count
        self.limit = limit
        super().__init__(
            f"Document {path} has {page_count} pages, "
            f"exceeding the limit of {limit}"
        )


# Backward and semantic aliases
DocumentProcessingError = DocumentError
OcrError = DocumentError
