"""RAG explanation generation sub-package."""

from nirmantra_ai.rag.generator import ExplanationGenerator
from nirmantra_ai.rag.models import CitationDetail, GroundedFinding
from nirmantra_ai.rag.prompts import (
    RAG_EXPLANATION_SYSTEM_PROMPT,
    format_rag_prompt,
)

__all__ = [
    "CitationDetail",
    "ExplanationGenerator",
    "GroundedFinding",
    "RAG_EXPLANATION_SYSTEM_PROMPT",
    "format_rag_prompt",
]
