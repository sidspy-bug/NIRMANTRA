"""
Application-wide configuration loaded from environment variables.

Usage:
    from nirmantra_ai.config import get_settings
    settings = get_settings()
    print(settings.llm_model)

All secrets are read from environment variables (or a .env file).
Nothing is hardcoded.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Nirmantra AI engine."""

    model_config = SettingsConfigDict(
        env_prefix="NIRMANTRA_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── LLM ───────────────────────────────────────────────────────────
    openai_api_key: str | None = Field(
        default=None,
        description="API key for OpenAI / OpenRouter.",
        alias="OPENAI_API_KEY",
    )
    openai_base_url: str | None = Field(
        default=None,
        description="Optional base URL for OpenAI-compatible providers like OpenRouter or Ollama.",
        alias="OPENAI_BASE_URL",
    )

    @property
    def llm_api_key(self) -> str | None:
        import os
        return self.openai_api_key or os.environ.get("OPENAI_API_KEY")
    llm_model: str = Field(
        default="gpt-4o",
        description="OpenAI / OpenRouter model name for text generation tasks.",
    )
    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI model name for embedding generation.",
    )

    # ── OCR ───────────────────────────────────────────────────────────
    tesseract_cmd: str = Field(
        default="tesseract",
        description="Path to the Tesseract OCR binary.",
        # This field does NOT use the NIRMANTRA_ prefix — it maps to
        # the TESSERACT_CMD env var directly.
        alias="TESSERACT_CMD",
    )
    ocr_languages: str = Field(
        default="eng+hin",
        description="Tesseract language codes ('+'-separated).",
    )

    # ── Vector store ──────────────────────────────────────────────────
    chroma_persist_dir: str = Field(
        default="./data/chroma_db",
        description="Directory for ChromaDB persistent storage.",
    )
    chroma_collection: str = Field(
        default="regulatory_docs",
        description="ChromaDB collection name for regulatory chunks.",
    )

    # ── Processing limits ─────────────────────────────────────────────
    max_pdf_pages: int = Field(
        default=500,
        ge=1,
        description="Maximum number of PDF pages to process per document.",
    )

    # ── Logging ───────────────────────────────────────────────────────
    log_level: str = Field(
        default="INFO",
        description="Python log level (DEBUG, INFO, WARNING, ERROR, CRITICAL).",
    )

    # ── API Server ────────────────────────────────────────────────────
    api_host: str = Field(default="127.0.0.1")
    api_port: int = Field(default=8000, ge=1, le=65535)

    # ── Derived helpers ───────────────────────────────────────────────

    @property
    def chroma_persist_path(self) -> Path:
        """Resolved absolute path for ChromaDB storage."""
        return Path(self.chroma_persist_dir).resolve()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton of the application settings."""
    return Settings()


def configure_logging(level: str | None = None) -> None:
    """Set up structured logging for the package.

    Args:
        level: Override log level. Defaults to the value in settings.
    """
    resolved_level = level or get_settings().log_level
    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Silence noisy third-party loggers
    for noisy in ("httpx", "httpcore", "chromadb", "openai"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
