"""
Tests for ExplanationGenerator and RAG grounded finding creation.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    RetrievalMatch,
    SourceReference,
)
from nirmantra_ai.rag.generator import ExplanationGenerator


def test_deterministic_fallback_when_no_llm() -> None:
    generator = ExplanationGenerator(llm_client=None)

    result = RuleResult(
        rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
        rule_name="Minimum Front Setback Requirement",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.FAIL,
        measured_value=4.0,
        permissible_limit=6.0,
        unit="m",
        details="Front setback of 4.0m is deficient by 2.0m.",
        source_citation="UBBL 2016 Clause 7.14.1",
        requires_human_review=True,
    )

    finding = generator.generate_finding(result)

    assert finding.rule_id == result.rule_id
    assert finding.status == RuleStatus.FAIL
    assert "deficient by 2.0m" in finding.explanation
    assert "UBBL 2016 Clause 7.14.1" in finding.regulatory_citations
    assert len(finding.next_steps) > 0
    assert any("Revise architectural drawings" in step for step in finding.next_steps)


def test_llm_grounded_finding_with_mock_client() -> None:
    mock_payload = {
        "explanation": "Front setback is deficient by 2m under Delhi UBBL 2016.",
        "next_steps": ["Adjust ground plinth back by 2 metres."],
    }
    mock_client = MockLLMClient(response_override=mock_payload)
    generator = ExplanationGenerator(llm_client=mock_client)

    result = RuleResult(
        rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
        rule_name="Front Setback",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.FAIL,
        details="Deficient setback",
        source_citation="UBBL 2016 Clause 7.14.1",
    )

    chunk = RegulatoryChunk(
        chunk_id="c1",
        content="Front setback shall be 6.0m for residential plots.",
        source=SourceReference(
            document_title="UBBL 2016",
            authority=RegulatoryAuthority.DDA,
            clause_or_section="7.14.1",
        ),
    )
    match = RetrievalMatch(chunk=chunk, score=0.9, match_type="semantic")

    finding = generator.generate_finding(result, retrieved_matches=[match])

    assert finding.explanation == "Front setback is deficient by 2m under Delhi UBBL 2016."
    assert finding.next_steps == ["Adjust ground plinth back by 2 metres."]
    assert any("UBBL 2016 (7.14.1)" in c for c in finding.regulatory_citations)
