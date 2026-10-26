"""
Unit tests for ComplianceReport models and ReportBuilder.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import (
    ComplianceEvaluationSummary,
    RuleResult,
    RuleStatus,
)
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    OccupancyType,
)
from nirmantra_ai.knowledge.models import RegulatoryCategory
from nirmantra_ai.reporting.models import (
    MANDATORY_LEGAL_DISCLAIMER,
    ComplianceReport,
    OverallComplianceStatus,
)
from nirmantra_ai.reporting.report_builder import ReportBuilder


def test_mandatory_disclaimer_always_present() -> None:
    builder = ReportBuilder()
    info = BuildingInfo(project_name=FieldProvenance.explicit("Apex Tower"))
    eval_summary = ComplianceEvaluationSummary(
        total_rules_evaluated=0,
        passed_count=0,
        failed_count=0,
        needs_review_count=0,
        not_applicable_count=0,
        results=[],
    )

    report = builder.build_report(info, eval_summary)

    assert report.disclaimer == MANDATORY_LEGAL_DISCLAIMER
    assert "Council of Architecture" in report.disclaimer
    assert "Delhi Fire Service" in report.disclaimer


def test_report_builder_computes_non_compliant_overall_status() -> None:
    builder = ReportBuilder()
    info = BuildingInfo(
        project_name=FieldProvenance.explicit("Deficient Complex"),
        occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
    )

    fail_result = RuleResult(
        rule_id="DELHI_UBBL_2016_SETBACK_FRONT",
        rule_name="Front Setback",
        category=RegulatoryCategory.SETBACK,
        status=RuleStatus.FAIL,
        details="Deficient front setback by 1.5m",
        source_citation="UBBL 2016",
        requires_human_review=True,
    )
    pass_result = RuleResult(
        rule_id="DELHI_DFS_CLEARANCE_REQUIRED",
        rule_name="DFS Clearance",
        category=RegulatoryCategory.FIRE_SAFETY,
        status=RuleStatus.PASS,
        details="Height <= 15m",
        source_citation="UBBL 2016",
    )

    eval_summary = ComplianceEvaluationSummary.from_results([fail_result, pass_result])
    report = builder.build_report(info, eval_summary)

    assert report.summary.overall_status == OverallComplianceStatus.NON_COMPLIANT
    assert report.summary.passed_count == 1
    assert report.summary.failed_count == 1
    assert report.summary.compliance_score_percent == 50.0
    assert report.is_fully_compliant is False
    assert len(report.findings) == 2
    assert len(report.actionable_recommendations) > 0


def test_report_builder_handles_needs_review_and_missing_checklist() -> None:
    builder = ReportBuilder()
    info = BuildingInfo(
        project_name=FieldProvenance.explicit("Incomplete Project"),
        extraction_warnings=["OCR low confidence on page 3"],
    )

    review_result = RuleResult(
        rule_id="DELHI_UBBL_2016_FAR_MAX",
        rule_name="Floor Area Ratio",
        category=RegulatoryCategory.FAR,
        status=RuleStatus.NEEDS_REVIEW,
        details="Plot area missing",
        source_citation="UBBL 2016",
        missing_evidence_fields=["plot_area_sqm"],
    )

    eval_summary = ComplianceEvaluationSummary.from_results([review_result])
    report = builder.build_report(info, eval_summary)

    assert report.summary.overall_status == OverallComplianceStatus.REQUIRES_REVIEW
    # Checklist must include both the rule missing fields and doc warnings
    assert any("Missing 'plot_area_sqm'" in item for item in report.missing_information_checklist)
    assert any("Document Note: OCR low confidence on page 3" in item for item in report.missing_information_checklist)
