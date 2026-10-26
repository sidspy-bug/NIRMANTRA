"""
Parking compliance rules for Delhi NCT.

Based on Unified Building Bye-Laws for Delhi 2016 (Clause 10.1 - Parking Standards)
and Master Plan for Delhi 2021 (MPD-2021 Table 17.1).
"""

from __future__ import annotations

import math

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class CommercialParkingRule(ComplianceRule):
    """Evaluates mandatory Equivalent Car Spaces (ECS) parking requirements under UBBL Clause 10.1."""

    rule_id = "DELHI_UBBL_2016_PARKING_ECS"
    rule_name = "Statutory Parking Provision (ECS Standards)"
    category = RegulatoryCategory.PARKING
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 10.1 & MPD 2021 Table 17.1"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value
        builtup_area = info.total_builtup_area_sqm.value
        provided_spaces = info.parking_spaces_provided.value

        missing = []
        if builtup_area is None:
            missing.append("total_builtup_area_sqm")
        if provided_spaces is None:
            missing.append("parking_spaces_provided")

        if missing:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details=f"Cannot determine statutory parking compliance; missing: {', '.join(missing)}.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing,
            )

        citation = self.source_citation
        # ECS rates per 100 sq.m of built-up area under UBBL Clause 10.1 / MPD 2021
        if occupancy == OccupancyType.HOTEL:
            ecs_rate = 3.0
            occ_name = "Commercial Hotel"
            citation = "UBBL-2016 Clause 10.1 & MPD-2021 Table 17.1 (Hotels: 3.0 ECS / 100 sqm)"
        elif occupancy == OccupancyType.SHOPPING_CENTER:
            ecs_rate = 3.0
            occ_name = "Shopping Center / Mall"
            citation = "UBBL-2016 Clause 10.1 & MPD-2021 Table 17.1 (Shopping Centers: 3.0 ECS / 100 sqm)"
        elif occupancy == OccupancyType.HOSPITAL:
            ecs_rate = 2.0
            occ_name = "Hospital / Healthcare Facility"
            citation = "UBBL-2016 Clause 10.1 & MPD-2021 Table 17.1 (Hospitals: 2.0 ECS / 100 sqm)"
        elif occupancy == OccupancyType.EDUCATIONAL:
            ecs_rate = 1.5
            occ_name = "Educational Institute"
            citation = "UBBL-2016 Clause 10.1 & MPD-2021 Table 17.1 (Educational: 1.5 ECS / 100 sqm)"
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            ecs_rate = 2.0
            occ_name = "Residential Plotted / Group Housing"
            citation = "UBBL-2016 Clause 10.1 (Residential: 2.0 ECS / 100 sqm)"
        else:
            ecs_rate = 2.0
            occ_name = "General Building"

        # Calculate required ECS
        required_spaces = math.ceil((builtup_area / 100.0) * ecs_rate)

        if provided_spaces >= required_spaces:
            status = RuleStatus.PASS
            details = (
                f"{occ_name}: Provided {provided_spaces} parking spaces meets or exceeds "
                f"the statutory requirement of {required_spaces} ECS ({ecs_rate} ECS per 100 sq.m for {builtup_area:.1f} sq.m built-up area)."
            )
        else:
            status = RuleStatus.FAIL
            shortage = required_spaces - provided_spaces
            details = (
                f"{occ_name}: Provided {provided_spaces} parking spaces is deficient by {shortage} ECS "
                f"(statutory requirement is {required_spaces} ECS based on {ecs_rate} ECS / 100 sq.m)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=float(provided_spaces),
            permissible_limit=float(required_spaces),
            unit="ECS",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
