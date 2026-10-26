"""
RAG Explanation Generator.

Grounds deterministic compliance rule results in retrieved bye-law passages,
producing natural language explanations and actionable next steps.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any, Sequence

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.extraction.client import LLMClient
from nirmantra_ai.knowledge.models import RetrievalMatch
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.rag.models import CitationDetail, GroundedFinding
from nirmantra_ai.rag.prompts import (
    RAG_EXPLANATION_SYSTEM_PROMPT,
    format_rag_prompt,
)

if TYPE_CHECKING:
    from nirmantra_ai.extraction.models import BuildingInfo

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    """Generates grounded explanations for rule engine findings using RAG and Unified Building Bye-Laws."""

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        retriever: HybridRetriever | None = None,
        min_relevance_score: float = 0.05,
    ) -> None:
        self.llm = llm_client
        self.retriever = retriever
        self.min_relevance_score = min_relevance_score
        self._retrieval_cache: dict[str, list[RetrievalMatch]] = {}

    def generate_finding(
        self,
        result: RuleResult,
        retrieved_matches: Sequence[RetrievalMatch] | None = None,
        building_context: BuildingInfo | dict[str, Any] | None = None,
    ) -> GroundedFinding:
        """Generate a grounded finding for an evaluated rule.

        Args:
            result: Deterministic evaluation result.
            retrieved_matches: Optional pre-fetched regulatory matches. If None and
                               retriever is present, fetches relevant passages automatically.
            building_context: Optional building parameters for rich contextual grounding.
        """
        # 1. Gather regulatory passages & citations with multi-query retrieval
        matches = list(retrieved_matches) if retrieved_matches is not None else []
        if not matches and self.retriever is not None:
            matches = self._retrieve_for_rule(result, building_context)

        # 2. Extract citations, excerpts, and structured citation metadata
        citations = [result.source_citation]
        citation_details: list[CitationDetail] = []
        passages: list[str] = []

        for m in matches:
            citation_str = f"{m.chunk.source.document_title} ({m.chunk.source.clause_or_section})"
            if citation_str not in citations:
                citations.append(citation_str)

            citation_details.append(
                CitationDetail(
                    citation=citation_str,
                    authority=m.chunk.source.authority.value,
                    clause_or_section=m.chunk.source.clause_or_section,
                    page_number=m.chunk.source.page_number,
                    excerpt=m.chunk.content[:240].strip() + ("..." if len(m.chunk.content) > 240 else ""),
                    relevance_score=m.score,
                )
            )
            passages.append(m.chunk.content)

        # 3. Format building context string if available
        b_context_str = self._format_building_context(building_context)

        # 4. Attempt LLM generation if client is configured
        if self.llm is not None:
            try:
                user_prompt = format_rag_prompt(
                    rule_id=result.rule_id,
                    rule_name=result.rule_name,
                    status=result.status.value,
                    measured_value=str(result.measured_value) if result.measured_value is not None else "",
                    permissible_limit=str(result.permissible_limit) if result.permissible_limit is not None else "",
                    unit=result.unit or "",
                    details=result.details,
                    missing_evidence=result.missing_evidence_fields,
                    passages=passages,
                    building_context=b_context_str,
                )

                response_data = self.llm.complete_json(
                    system_prompt=RAG_EXPLANATION_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                )

                explanation = response_data.get("explanation", result.details)
                next_steps = response_data.get("next_steps", self._deterministic_next_steps(result))

                return GroundedFinding(
                    rule_id=result.rule_id,
                    rule_name=result.rule_name,
                    status=result.status,
                    explanation=explanation,
                    regulatory_citations=citations,
                    next_steps=next_steps,
                    requires_human_review=result.requires_human_review,
                    missing_evidence=result.missing_evidence_fields,
                    retrieved_excerpts=passages,
                    citation_details=citation_details,
                )
            except Exception as exc:
                logger.warning("LLM explanation generation failed: %s. Using deterministic fallback.", exc)

        # 5. Deterministic fallback (offline, mock client, or LLM error)
        return self._deterministic_fallback(
            result=result,
            citations=citations,
            passages=passages,
            citation_details=citation_details,
        )

    def generate_findings_batch(
        self,
        results: Sequence[RuleResult],
        building_context: BuildingInfo | dict[str, Any] | None = None,
    ) -> list[GroundedFinding]:
        """Generate grounded findings for multiple rule results with retrieval caching."""
        findings: list[GroundedFinding] = []
        for res in results:
            findings.append(
                self.generate_finding(
                    result=res,
                    building_context=building_context,
                )
            )
        return findings

    def _retrieve_for_rule(
        self,
        result: RuleResult,
        building_context: BuildingInfo | dict[str, Any] | None = None,
    ) -> list[RetrievalMatch]:
        """Performs multi-query search against Unified Building Bye-Laws store."""
        if self.retriever is None:
            return []

        cache_key = f"{result.rule_id}_{result.status.value}"
        if cache_key in self._retrieval_cache:
            return self._retrieval_cache[cache_key]

        all_matches: list[RetrievalMatch] = []
        seen_chunks: set[str] = set()

        # Query A: Primary topic query
        primary_query = f"{result.rule_name} Delhi building regulations"
        matches_a = self.retriever.retrieve(
            query=primary_query,
            n_results=3,
            category=result.category,
        )
        for m in matches_a:
            if m.score >= self.min_relevance_score and m.chunk.chunk_id not in seen_chunks:
                seen_chunks.add(m.chunk.chunk_id)
                all_matches.append(m)

        # Query B: Clause specific query if present in source_citation
        clause_match = re.search(r"(?:Clause|Section|Table|Rule)\s+[\d\.]+", result.source_citation)
        if clause_match:
            clause_str = clause_match.group(0)
            matches_b = self.retriever.retrieve(
                query=f"{clause_str} Delhi UBBL",
                n_results=2,
            )
            for m in matches_b:
                if m.score >= self.min_relevance_score and m.chunk.chunk_id not in seen_chunks:
                    seen_chunks.add(m.chunk.chunk_id)
                    all_matches.append(m)

        # Sort combined matches by relevance score
        all_matches.sort(key=lambda m: m.score, reverse=True)
        top_matches = all_matches[:4]
        self._retrieval_cache[cache_key] = top_matches
        return top_matches

    def _deterministic_fallback(
        self,
        result: RuleResult,
        citations: list[str],
        passages: list[str] | None = None,
        citation_details: list[CitationDetail] | None = None,
    ) -> GroundedFinding:
        """Produce a high-quality grounded finding without LLM dependencies."""
        explanation = f"{result.details} Verified in accordance with {result.source_citation}."
        if citation_details and len(citation_details) > 0:
            top_cite = citation_details[0]
            if top_cite.clause_or_section and top_cite.clause_or_section not in result.source_citation:
                explanation += f" Cross-referenced with statutory provision {top_cite.clause_or_section}."

        next_steps = self._deterministic_next_steps(result)

        return GroundedFinding(
            rule_id=result.rule_id,
            rule_name=result.rule_name,
            status=result.status,
            explanation=explanation,
            regulatory_citations=citations,
            next_steps=next_steps,
            requires_human_review=result.requires_human_review,
            missing_evidence=result.missing_evidence_fields,
            retrieved_excerpts=passages or [],
            citation_details=citation_details or [],
        )

    @staticmethod
    def _deterministic_next_steps(result: RuleResult) -> list[str]:
        """Standard actionable guidance derived from rule evaluation status and metric deltas."""
        if result.status == RuleStatus.PASS:
            return ["Maintain current dimensions in final submission drawings."]
        elif result.status == RuleStatus.FAIL:
            steps = [
                f"Revise architectural drawings to bring {result.rule_name} within statutory limits.",
                "Consult a certified structural engineer / architect to adjust plinth and layout geometry.",
            ]
            # Add specific numerical remediation if numeric values exist
            if (
                result.measured_value is not None
                and result.permissible_limit is not None
                and isinstance(result.measured_value, (int, float))
                and isinstance(result.permissible_limit, (int, float))
            ):
                unit_str = f" {result.unit}" if result.unit else ""
                diff = abs(result.measured_value - result.permissible_limit)
                if result.measured_value < result.permissible_limit:
                    steps.append(
                        f"Increase {result.rule_name} by at least {diff:.2f}{unit_str} "
                        f"(current: {result.measured_value}{unit_str}, statutory min: {result.permissible_limit}{unit_str})."
                    )
                else:
                    steps.append(
                        f"Reduce {result.rule_name} by {diff:.2f}{unit_str} "
                        f"to stay within maximum permissible cap of {result.permissible_limit}{unit_str}."
                    )
            return steps
        elif result.status == RuleStatus.NEEDS_REVIEW:
            if result.missing_evidence_fields:
                fields_str = ", ".join(result.missing_evidence_fields)
                return [
                    f"Submit revised floor plans or sanction schedule clearly indicating: {fields_str}.",
                    "Ensure all dimensions are annotated with explicit metric units (metres or sq.m).",
                ]
            else:
                return [
                    "Manual physical inspection of site drawings is required by a licensed professional.",
                    "If building exceeds 15.0m, initiate formal application with Delhi Fire Service (DFS).",
                ]
        else:  # NOT_APPLICABLE
            return ["No action required for this parameter."]

    @staticmethod
    def _format_building_context(context: BuildingInfo | dict[str, Any] | None) -> str:
        """Format building context metadata into a clear bulleted block for prompt injection."""
        if not context:
            return ""

        if isinstance(context, dict):
            lines = [f"- {k}: {v}" for k, v in context.items() if v]
            return "\n".join(lines)

        lines: list[str] = []
        if hasattr(context, "occupancy_type") and context.occupancy_type.value:
            lines.append(f"- Occupancy Classification: {context.occupancy_type.value}")
        if hasattr(context, "plot_area_sqm") and context.plot_area_sqm.value:
            lines.append(f"- Plot Area: {context.plot_area_sqm.value} sq.m")
        if hasattr(context, "total_builtup_area_sqm") and context.total_builtup_area_sqm.value:
            lines.append(f"- Total Built-up Area: {context.total_builtup_area_sqm.value} sq.m")
        if hasattr(context, "building_height_m") and context.building_height_m.value:
            lines.append(f"- Building Height: {context.building_height_m.value} metres")
        if hasattr(context, "front_road_width_m") and context.front_road_width_m.value:
            lines.append(f"- Road Width: {context.front_road_width_m.value} metres")

        return "\n".join(lines)
