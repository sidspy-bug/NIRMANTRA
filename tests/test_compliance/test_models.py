"""
Tests for Compliance models and summary aggregation.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import (
    ComplianceEvaluationSummary,
    RuleResult,
    RuleStatus,
)
from nirmantra_ai.knowledge.models import RegulatoryCategory


def test_rule_result_is_conclusive_property() -> None:
    res_pass = RuleResult(
        rule_id="R1",
        rule_name="Test Rule",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.PASS,
        details="Complies",
        source_citation="UBBL 2016",
    )
    assert res_pass.is_conclusive is True

    res_review = RuleResult(
        rule_id="R2",
        rule_name="Test Rule 2",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.NEEDS_REVIEW,
        details="Missing data",
        source_citation="UBBL 2016",
        missing_evidence_fields=["plot_area_sqm"],
    )
    assert res_review.is_conclusive is False


def test_compliance_summary_aggregation() -> None:
    results = [
        RuleResult(
            rule_id="R1",
            rule_name="Rule 1",
            category=RegulatoryCategory.SETBACK,
            status=RuleStatus.PASS,
            details="",
            source_citation="",
        ),
        RuleResult(
            rule_id="R2",
            rule_name="Rule 2",
            category=RegulatoryCategory.FAR,
            status=RuleStatus.FAIL,
            details="",
            source_citation="",
        ),
        RuleResult(
            rule_id="R3",
            rule_name="Rule 3",
            category=RegulatoryCategory.FIRE_SAFETY,
            status=RuleStatus.NEEDS_REVIEW,
            details="",
            source_citation="",
        ),
        RuleResult(
            rule_id="R4",
            rule_name="Rule 4",
            category=RegulatoryCategory.FIRE_SAFETY,
            status=RuleStatus.NOT_APPLICABLE,
            details="",
            source_citation="",
        ),
    ]

    summary = ComplianceEvaluationSummary.from_results(results)
    assert summary.total_rules_evaluated == 4
    assert summary.passed_count == 1
    assert summary.failed_count == 1
    assert summary.needs_review_count == 1
    assert summary.not_applicable_count == 1
