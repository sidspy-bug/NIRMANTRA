"""
Hospital and Healthcare facility compliance rules for Delhi NCT.

Based on Unified Building Bye-Laws for Delhi 2016 (Clause 8.4.2, 8.4.3),
NBC 2016 Part 4 (Life and Fire Safety for Institutional Buildings),
and Delhi Fire Service Guidelines for Hospitals.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class HospitalSafetyRule(ComplianceRule):
    """Evaluates mandatory hospital safety features: corridor width for stretcher movement and evacuation ramp."""

    rule_id = "DELHI_UBBL_2016_HOSPITAL_SAFETY"
    rule_name = "Hospital Stretcher Corridor & Evacuation Ramp"
    category = RegulatoryCategory.FIRE_SAFETY
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 8.4.2 & NBC 2016 Part 4 (Institutional - Hospitals)"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        # Only applies to Hospital / Healthcare facilities
        if occupancy != OccupancyType.HOSPITAL:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"Hospital safety rule not applicable to {occupancy.value if occupancy else 'non-hospital'} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        corridor_width = info.fire_safety.corridor_width_m.value
        ramp_provided = info.fire_safety.ramp_provided.value

        missing = []
        if corridor_width is None:
            missing.append("fire_safety.corridor_width_m")
        if ramp_provided is None:
            missing.append("fire_safety.ramp_provided")

        if missing:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=2.40,
                unit="m",
                details=(
                    "Hospitals require min 2.40 m corridor width for bed movement and evacuation ramps. "
                    f"Missing required parameters: {', '.join(missing)}."
                ),
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing,
            )

        min_corridor_required = 2.40
        corridor_pass = corridor_width >= min_corridor_required
        ramp_pass = bool(ramp_provided)

        if corridor_pass and ramp_pass:
            status = RuleStatus.PASS
            details = (
                f"Hospital corridor width of {corridor_width:.2f} m satisfies statutory minimum (2.40 m), "
                "and evacuation ramp is confirmed for bed/stretcher patient evacuation."
            )
        else:
            status = RuleStatus.FAIL
            defects = []
            if not corridor_pass:
                defects.append(
                    f"Corridor width {corridor_width:.2f} m is deficient by {min_corridor_required - corridor_width:.2f} m (min 2.40 m required)"
                )
            if not ramp_pass:
                defects.append("Mandatory hospital patient evacuation ramp is missing")
            details = f"Hospital safety non-compliance: {'; '.join(defects)}."

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=corridor_width,
            permissible_limit=min_corridor_required,
            unit="m",
            details=details,
            source_citation=self.source_citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
