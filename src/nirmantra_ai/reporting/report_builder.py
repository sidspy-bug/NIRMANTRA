"""
Report builder assembling extraction data, deterministic evaluations,
and grounded explanations into a final ComplianceReport.
"""

from __future__ import annotations

import logging
from typing import Sequence

from nirmantra_ai.compliance.models import ComplianceEvaluationSummary, RuleStatus
from nirmantra_ai.extraction.models import BuildingInfo
from nirmantra_ai.rag.generator import ExplanationGenerator
from nirmantra_ai.rag.models import GroundedFinding
from nirmantra_ai.reporting.models import (
    ComplianceReport,
    OverallComplianceStatus,
    ReportSummary,
)

logger = logging.getLogger(__name__)


class ReportBuilder:
    """Builds comprehensive, auditable ComplianceReport objects."""

    def __init__(self, explanation_generator: ExplanationGenerator | None = None) -> None:
        self.explanation_gen = explanation_generator or ExplanationGenerator()

    def build_report(
        self,
        info: BuildingInfo,
        eval_summary: ComplianceEvaluationSummary,
    ) -> ComplianceReport:
        """Assemble a complete ComplianceReport.

        Args:
            info: Extracted BuildingInfo.
            eval_summary: Output from ComplianceEngine.evaluate().

        Returns:
            Fully populated ComplianceReport.
        """
        logger.info("Assembling report for %s", info.project_name.value or "unnamed project")

        # 1. Generate grounded findings for each evaluated rule with building context
        if hasattr(self.explanation_gen, "generate_findings_batch"):
            findings = self.explanation_gen.generate_findings_batch(
                eval_summary.results,
                building_context=info,
            )
        else:
            findings = [
                self.explanation_gen.generate_finding(result, building_context=info)
                for result in eval_summary.results
            ]

        # 2. Compile missing information checklist
        missing_checklist: list[str] = []
        for res in eval_summary.results:
            for field in res.missing_evidence_fields:
                item = f"{res.rule_name}: Missing '{field}'"
                if item not in missing_checklist:
                    missing_checklist.append(item)

        for warn in info.extraction_warnings:
            if warn not in missing_checklist:
                missing_checklist.append(f"Document Note: {warn}")

        # 3. Collate unique actionable recommendations
        actionable_steps: list[str] = []
        for f in findings:
            for step in f.next_steps:
                if step not in actionable_steps and "No action required" not in step:
                    actionable_steps.append(step)

        # 4. Compute overall status and score
        if eval_summary.failed_count > 0:
            overall_status = OverallComplianceStatus.NON_COMPLIANT
        elif eval_summary.needs_review_count > 0:
            overall_status = OverallComplianceStatus.REQUIRES_REVIEW
        else:
            overall_status = OverallComplianceStatus.COMPLIANT

        conclusive_total = eval_summary.passed_count + eval_summary.failed_count
        if conclusive_total > 0:
            score = round((eval_summary.passed_count / conclusive_total) * 100.0, 1)
        else:
            score = 0.0

        summary = ReportSummary(
            overall_status=overall_status,
            total_requirements_checked=eval_summary.total_rules_evaluated,
            passed_count=eval_summary.passed_count,
            failed_count=eval_summary.failed_count,
            needs_review_count=eval_summary.needs_review_count,
            not_applicable_count=eval_summary.not_applicable_count,
            compliance_score_percent=score,
        )

        return ComplianceReport(
            project_name=info.project_name.value or "Unnamed Project",
            location_address=info.location_address.value,
            source_document=info.source_filename,
            summary=summary,
            findings=findings,
            missing_information_checklist=missing_checklist,
            actionable_recommendations=actionable_steps,
        )
