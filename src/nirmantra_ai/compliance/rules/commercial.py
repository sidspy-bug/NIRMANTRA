"""
Shopping Center and Commercial complex compliance rules for Delhi NCT.

Based on Unified Building Bye-Laws for Delhi 2016 (Clause 9.3.2)
and NBC 2016 Part 4 (Life Safety for Mercantile Occupancies).
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class ShoppingCenterExitRule(ComplianceRule):
    """Evaluates travel distance to nearest exit and multiple emergency staircases in Shopping Centers."""

    rule_id = "DELHI_UBBL_2016_SHOPPING_CENTER_EXIT"
    rule_name = "Shopping Center Exit Travel Distance & Egress"
    category = RegulatoryCategory.FIRE_SAFETY
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 9.3.2 & NBC 2016 Part 4 Table 5 (Mercantile)"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        # Only applies to Shopping Centers / Mercantile
        if occupancy != OccupancyType.SHOPPING_CENTER:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"Shopping center exit rule not applicable to {occupancy.value if occupancy else 'non-shopping center'} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        travel_dist = info.fire_safety.travel_distance_to_exit_m.value
        staircase_count = info.fire_safety.number_of_staircases.value
        exits_count = info.fire_safety.emergency_exits_count.value

        missing = []
        if travel_dist is None:
            missing.append("fire_safety.travel_distance_to_exit_m")

        effective_exits = staircase_count or exits_count
        if effective_exits is None:
            missing.append("fire_safety.number_of_staircases or emergency_exits_count")

        if missing:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=30.0,
                unit="m",
                details=(
                    "Shopping centers require max 30.0 m travel distance to exits and at least 2 independent staircases. "
                    f"Missing required parameters: {', '.join(missing)}."
                ),
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing,
            )

        max_travel_dist = 30.0
        dist_pass = travel_dist <= max_travel_dist
        exits_pass = effective_exits >= 2

        if dist_pass and exits_pass:
            status = RuleStatus.PASS
            details = (
                f"Travel distance of {travel_dist:.2f} m is within the statutory 30.0 m limit, "
                f"and {effective_exits} independent emergency exit staircases are provided."
            )
        else:
            status = RuleStatus.FAIL
            defects = []
            if not dist_pass:
                excess = round(travel_dist - max_travel_dist, 2)
                defects.append(
                    f"Travel distance of {travel_dist:.2f} m exceeds statutory maximum of 30.0 m by {excess} m"
                )
            if not exits_pass:
                defects.append(
                    f"Provided {effective_exits} emergency exit(s); minimum 2 independent staircases required"
                )
            details = f"Shopping center egress non-compliance: {'; '.join(defects)}."

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=travel_dist,
            permissible_limit=max_travel_dist,
            unit="m",
            details=details,
            source_citation=self.source_citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
