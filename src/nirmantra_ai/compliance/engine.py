"""
Deterministic statutory compliance rule engine for Delhi NCT.

Evaluates an extracted BuildingInfo against all registered bye-laws
and statutory standards. Zero LLM hallucination in pass/fail logic.
"""

from __future__ import annotations

import logging
from typing import Sequence

from nirmantra_ai.compliance.models import (
    ComplianceEvaluationSummary,
    RuleResult,
    RuleStatus,
)
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.compliance.rules.commercial import ShoppingCenterExitRule
from nirmantra_ai.compliance.rules.far import FloorAreaRatioRule, GroundCoverageRule
from nirmantra_ai.compliance.rules.fire_safety import (
    FireDetectionEquipmentRule,
    FireServiceClearanceRule,
    StaircaseWidthRule,
)
from nirmantra_ai.compliance.rules.hospital import HospitalSafetyRule
from nirmantra_ai.compliance.rules.parking import CommercialParkingRule
from nirmantra_ai.compliance.rules.setback import (
    FrontSetbackRule,
    RearSetbackRule,
    SideSetbackRule,
)
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory

logger = logging.getLogger(__name__)

FOCUS_OCCUPANCIES = {
    OccupancyType.EDUCATIONAL,
    OccupancyType.HOSPITAL,
    OccupancyType.HOTEL,
    OccupancyType.SHOPPING_CENTER,
}


def get_default_delhi_rules() -> list[ComplianceRule]:
    """Instantiate standard suite of statutory rules for Delhi NCT."""
    return [
        FrontSetbackRule(),
        RearSetbackRule(),
        FloorAreaRatioRule(),
        GroundCoverageRule(),
        FireServiceClearanceRule(),
        StaircaseWidthRule(),
        FireDetectionEquipmentRule(),
    ]


def get_focus_occupancy_rules() -> list[ComplianceRule]:
    """Instantiate full statutory rules suite specialized for Educational, Hospital, Hotel, and Shopping Center."""
    return [
        FrontSetbackRule(),
        RearSetbackRule(),
        SideSetbackRule(),
        FloorAreaRatioRule(),
        GroundCoverageRule(),
        FireServiceClearanceRule(),
        StaircaseWidthRule(),
        FireDetectionEquipmentRule(),
        HospitalSafetyRule(),
        ShoppingCenterExitRule(),
        CommercialParkingRule(),
    ]


class ComplianceEngine:
    """Executes deterministic compliance rules against BuildingInfo."""

    def __init__(self, rules: Sequence[ComplianceRule] | None = None) -> None:
        """
        Args:
            rules: Sequence of compliance rules to evaluate. If None,
                   defaults to standard Delhi NCT rules.
        """
        self._rules: list[ComplianceRule] = list(rules) if rules is not None else get_default_delhi_rules()
        logger.info("ComplianceEngine initialized with %d active rules.", len(self._rules))

    @property
    def registered_rules(self) -> list[ComplianceRule]:
        return list(self._rules)

    @property
    def rules(self) -> list[ComplianceRule]:
        """Alias for registered_rules."""
        return list(self._rules)

    def register_rule(self, rule: ComplianceRule) -> None:
        """Register an additional compliance rule."""
        self._rules.append(rule)
        logger.info("Registered rule: %s (%s)", rule.rule_id, rule.rule_name)

    def evaluate(
        self,
        info: BuildingInfo,
        categories: Sequence[RegulatoryCategory] | None = None,
    ) -> ComplianceEvaluationSummary:
        """Evaluate all applicable registered rules against extracted building parameters.

        Args:
            info: Extracted and normalized BuildingInfo model.
            categories: Optional filter to evaluate only specific categories (e.g., [SETBACK, FAR]).

        Returns:
            ComplianceEvaluationSummary containing per-rule determinations and aggregated counts.
        """
        results: list[RuleResult] = []
        target_categories = set(categories) if categories else None
        active_rules = list(self._rules)

        # For focal commercial and institutional occupancies, automatically include specialized rules
        # if they have not been explicitly replaced or registered.
        occ = info.occupancy_type.value
        if occ in FOCUS_OCCUPANCIES:
            existing_rule_ids = {r.rule_id for r in active_rules}
            specialized: list[ComplianceRule] = [
                SideSetbackRule(),
                CommercialParkingRule(),
            ]
            if occ == OccupancyType.HOSPITAL:
                specialized.append(HospitalSafetyRule())
            elif occ == OccupancyType.SHOPPING_CENTER:
                specialized.append(ShoppingCenterExitRule())

            for sp_rule in specialized:
                if sp_rule.rule_id not in existing_rule_ids:
                    active_rules.append(sp_rule)

        logger.info("Evaluating compliance for: %s", info.project_name.value or "unnamed project")

        for rule in active_rules:
            if target_categories and rule.category not in target_categories:
                continue

            try:
                res = rule.evaluate(info)
                logger.debug(
                    "Rule %s evaluated -> %s (%s)",
                    rule.rule_id,
                    res.status.value,
                    res.details[:60],
                )
                results.append(res)
            except Exception as exc:
                logger.error("Error evaluating rule %s: %s", rule.rule_id, exc)
                results.append(
                    RuleResult(
                        rule_id=rule.rule_id,
                        rule_name=rule.rule_name,
                        category=rule.category,
                        status=RuleStatus.NEEDS_REVIEW,
                        details=f"Evaluation encountered an internal error: {exc}",
                        source_citation=rule.source_citation,
                        rule_version=rule.rule_version,
                        requires_human_review=True,
                    )
                )

        summary = ComplianceEvaluationSummary.from_results(results)
        logger.info(
            "Evaluation complete: %d evaluated | %d PASS | %d FAIL | %d REVIEW | %d N/A",
            summary.total_rules_evaluated,
            summary.passed_count,
            summary.failed_count,
            summary.needs_review_count,
            summary.not_applicable_count,
        )
        return summary
