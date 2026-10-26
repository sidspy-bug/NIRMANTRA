"""
Enhanced tests for ExplanationGenerator multi-query, building context, and batch processing.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.extraction.models import BuildingInfo, FieldProvenance, OccupancyType
from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.ingest import RegulatoryIngester
from nirmantra_ai.knowledge.models import RegulatoryAuthority, RegulatoryCategory
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.knowledge.store import RegulatoryStore
from nirmantra_ai.rag.generator import ExplanationGenerator


@pytest.fixture
def hybrid_retriever() -> HybridRetriever:
    store = RegulatoryStore(collection_name="test_rag_enhanced", in_memory=True)
    embedder = DeterministicMockEmbeddingClient(dimensions=64)
    ingester = RegulatoryIngester(store=store, embedding_client=embedder)

    provisions = [
        {
            "clause": "Clause 7.14.1",
            "content": "For residential plotted development up to 500 sqm, front setback shall be 6.0 metres.",
            "category": "setback",
        },
        {
            "clause": "Table 7.1",
            "content": "Maximum Floor Area Ratio (FAR) shall be 225 for residential plots above 250 sqm.",
            "category": "floor_area_ratio",
        },
    ]
    ingester.ingest_raw_provisions(
        provisions=provisions,
        document_title="UBBL 2016",
        authority=RegulatoryAuthority.DDA,
    )
    return HybridRetriever(store=store, embedding_client=embedder)


def test_generator_multi_query_and_citation_details(hybrid_retriever: HybridRetriever) -> None:
    generator = ExplanationGenerator(llm_client=None, retriever=hybrid_retriever)

    result = RuleResult(
        rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
        rule_name="Minimum Front Setback Requirement",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.FAIL,
        measured_value=4.5,
        permissible_limit=6.0,
        unit="m",
        details="Front setback of 4.5m is deficient by 1.5m.",
        source_citation="UBBL 2016 Clause 7.14.1",
    )

    finding = generator.generate_finding(result)

    assert finding.rule_id == result.rule_id
    assert finding.status == RuleStatus.FAIL
    assert len(finding.citation_details) > 0
    assert any("7.14.1" in c.clause_or_section for c in finding.citation_details)
    assert len(finding.retrieved_excerpts) > 0
    # Numerical delta remediation check
    assert any("1.50 m" in s or "1.50m" in s for s in finding.next_steps)


def test_generator_with_building_context(hybrid_retriever: HybridRetriever) -> None:
    mock_payload = {
        "explanation": "Front setback is deficient for residential plotted building on 450 sqm plot.",
        "next_steps": ["Adjust boundary wall plinth line back by 1.50m."],
    }
    mock_client = MockLLMClient(response_override=mock_payload)
    generator = ExplanationGenerator(llm_client=mock_client, retriever=hybrid_retriever)

    info = BuildingInfo(
        occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
        plot_area_sqm=FieldProvenance.explicit(450.0),
        building_height_m=FieldProvenance.explicit(14.0),
    )

    result = RuleResult(
        rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
        rule_name="Front Setback",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.FAIL,
        details="Deficient setback",
        source_citation="UBBL 2016 Clause 7.14.1",
    )

    finding = generator.generate_finding(result, building_context=info)

    assert finding.explanation == "Front setback is deficient for residential plotted building on 450 sqm plot."
    assert "Adjust boundary wall" in finding.next_steps[0]


def test_generate_findings_batch(hybrid_retriever: HybridRetriever) -> None:
    generator = ExplanationGenerator(llm_client=None, retriever=hybrid_retriever)

    results = [
        RuleResult(
            rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
            rule_name="Front Setback",
            category=RegulatoryCategory.SETBACK,
            status=RuleStatus.PASS,
            details="Compliant front setback",
            source_citation="UBBL 2016 Clause 7.14.1",
        ),
        RuleResult(
            rule_id="DELHI_UBBL_2016_FAR",
            rule_name="Floor Area Ratio",
            category=RegulatoryCategory.FAR,
            status=RuleStatus.PASS,
            details="Compliant FAR",
            source_citation="UBBL 2016 Table 7.1",
        ),
    ]

    findings = generator.generate_findings_batch(results)
    assert len(findings) == 2
    assert findings[0].rule_id == "DELHI_UBBL_2016_SETBACK_FRONT"
    assert findings[1].rule_id == "DELHI_UBBL_2016_FAR"
