"""
Tests for application configuration.
"""

from __future__ import annotations

import os

from nirmantra_ai.config import Settings


class TestSettings:
    """Test that Settings loads correctly from defaults and env vars."""

    def test_default_values(self) -> None:
        """Settings should work with no env vars set (using defaults)."""
        settings = Settings(_env_file=None)
        assert settings.llm_model == "gpt-4o"
        assert settings.embedding_model == "text-embedding-3-small"
        assert settings.max_pdf_pages == 500
        assert settings.log_level == "INFO"
        assert settings.api_port == 8000
        assert settings.ocr_languages == "eng+hin"

    def test_env_override(self, monkeypatch) -> None:
        """Settings should pick up NIRMANTRA_* env vars."""
        monkeypatch.setenv("NIRMANTRA_LLM_MODEL", "gpt-4o-mini")
        monkeypatch.setenv("NIRMANTRA_MAX_PDF_PAGES", "100")
        monkeypatch.setenv("NIRMANTRA_LOG_LEVEL", "DEBUG")

        settings = Settings()
        assert settings.llm_model == "gpt-4o-mini"
        assert settings.max_pdf_pages == 100
        assert settings.log_level == "DEBUG"

    def test_chroma_persist_path_resolves(self) -> None:
        settings = Settings()
        path = settings.chroma_persist_path
        assert path.is_absolute()

    def test_port_validation(self) -> None:
        """Port must be 1-65535."""
        import pytest
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            Settings(api_port=0)  # type: ignore[call-arg]

        with pytest.raises(ValidationError):
            Settings(api_port=70000)  # type: ignore[call-arg]
