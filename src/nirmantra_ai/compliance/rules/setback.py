"""
Deterministic Setback compliance rules for Delhi NCT.

Based on the Unified Building Bye-Laws for Delhi 2016 (UBBL-2016),
Clause 7.14.1 - Setbacks for Residential Plotted Development.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class FrontSetbackRule(ComplianceRule):
    """Evaluates Front Setback according to plot area under UBBL 2016 Clause 7.14.1."""

    rule_id = "DELHI_UBBL_2016_SETBACK_FRONT"
    rule_name = "Minimum Front Setback Requirement"
    category = RegulatoryCategory.SETBACK
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 7.14.1, Table 7.1"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        # Check for missing plot area
        plot_area = info.plot_area_sqm.value
        if plot_area is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details="Plot area is missing from the document; cannot compute statutory front setback requirement.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["plot_area_sqm"],
            )

        citation = self.source_citation
        # Statutory front setback thresholds for focal occupancies
        if occupancy in {
            OccupancyType.EDUCATIONAL,
            OccupancyType.HOSPITAL,
            OccupancyType.HOTEL,
            OccupancyType.SHOPPING_CENTER,
        }:
            citation = "Unified Building Bye-Laws for Delhi 2016 Clause 7.13 & MPD 2021 (Commercial & Institutional Setbacks)"
            if plot_area <= 500.0:
                required_front = 6.0
            elif plot_area <= 1500.0:
                required_front = 9.0
            elif plot_area <= 5000.0:
                required_front = 12.0
            else:
                required_front = 15.0
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            if plot_area <= 100.0:
                required_front = 1.5
            elif plot_area <= 250.0:
                required_front = 3.0
            elif plot_area <= 500.0:
                required_front = 6.0
            else:
                required_front = 9.0
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"Front setback rule not applicable to {occupancy.value} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        # Check for missing measured setback
        measured_front = info.setbacks.front_m.value
        if measured_front is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=required_front,
                unit="m",
                details=(
                    f"Required front setback for plot area {plot_area} sq.m is {required_front} m, "
                    "but front setback measurement is missing from the submitted document."
                ),
                source_citation=citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["setbacks.front_m"],
            )

        # Evaluation
        if measured_front >= required_front:
            status = RuleStatus.PASS
            details = (
                f"Front setback of {measured_front:.2f} m meets or exceeds the required "
                f"minimum of {required_front:.2f} m for plot area {plot_area} sq.m."
            )
        else:
            status = RuleStatus.FAIL
            deficit = round(required_front - measured_front, 2)
            details = (
                f"Front setback of {measured_front:.2f} m is deficient by {deficit} m "
                f"(statutory minimum is {required_front:.2f} m for plot area {plot_area} sq.m)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=measured_front,
            permissible_limit=required_front,
            unit="m",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )


class RearSetbackRule(ComplianceRule):
    """Evaluates Rear Setback according to plot area under UBBL 2016 Clause 7.14.1 & Chapter 7."""

    rule_id = "DELHI_UBBL_2016_SETBACK_REAR"
    rule_name = "Minimum Rear Setback Requirement"
    category = RegulatoryCategory.SETBACK
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 7.14.1, Table 7.1"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        plot_area = info.plot_area_sqm.value
        if plot_area is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details="Plot area missing; cannot determine required rear setback.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["plot_area_sqm"],
            )

        citation = self.source_citation
        # Statutory rear setback thresholds
        if occupancy in {
            OccupancyType.EDUCATIONAL,
            OccupancyType.HOSPITAL,
            OccupancyType.HOTEL,
            OccupancyType.SHOPPING_CENTER,
        }:
            citation = "Unified Building Bye-Laws for Delhi 2016 Clause 7.13 & MPD 2021 (Commercial & Institutional Setbacks)"
            if plot_area <= 500.0:
                required_rear = 3.0
            elif plot_area <= 1500.0:
                required_rear = 6.0
            else:
                required_rear = 9.0
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            if plot_area <= 100.0:
                required_rear = 0.0
            elif plot_area <= 250.0:
                required_rear = 2.0
            elif plot_area <= 750.0:
                required_rear = 3.0
            else:
                required_rear = 6.0
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"Rear setback rule not applicable to {occupancy.value} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        measured_rear = info.setbacks.rear_m.value
        if measured_rear is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=required_rear,
                unit="m",
                details=(
                    f"Required rear setback for plot {plot_area} sq.m is {required_rear} m, "
                    "but rear setback measurement is not provided."
                ),
                source_citation=citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["setbacks.rear_m"],
            )

        if measured_rear >= required_rear:
            status = RuleStatus.PASS
            details = (
                f"Rear setback of {measured_rear:.2f} m meets or exceeds the required "
                f"minimum of {required_rear:.2f} m for plot {plot_area} sq.m."
            )
        else:
            status = RuleStatus.FAIL
            deficit = round(required_rear - measured_rear, 2)
            details = (
                f"Rear setback of {measured_rear:.2f} m is deficient by {deficit} m "
                f"(statutory minimum is {required_rear:.2f} m for plot {plot_area} sq.m)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=measured_rear,
            permissible_limit=required_rear,
            unit="m",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )


class SideSetbackRule(ComplianceRule):
    """Evaluates Side Setbacks for emergency access and fire tender driveway under UBBL 2016."""

    rule_id = "DELHI_UBBL_2016_SETBACK_SIDE"
    rule_name = "Minimum Side Setback Requirement (Emergency Access)"
    category = RegulatoryCategory.SETBACK
    source_citation = "Unified Building Bye-Laws for Delhi 2016 Clause 7.13 & Clause 8.4"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value
        plot_area = info.plot_area_sqm.value

        if plot_area is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details="Plot area is missing; cannot determine required side setback.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["plot_area_sqm"],
            )

        if occupancy in {
            OccupancyType.EDUCATIONAL,
            OccupancyType.HOSPITAL,
            OccupancyType.HOTEL,
            OccupancyType.SHOPPING_CENTER,
        }:
            required_side = 3.0 if plot_area <= 500.0 else 6.0
            citation = "UBBL-2016 Clause 8.4.1 (Mandatory 6m Clear Driveway for Institutional/Commercial)"
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            if plot_area <= 250.0:
                required_side = 0.0
            elif plot_area <= 500.0:
                required_side = 3.0
            else:
                required_side = 3.0
            citation = self.source_citation
        else:
            required_side = 3.0
            citation = self.source_citation

        # If zero required, passes automatically
        if required_side == 0.0:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.PASS,
                measured_value=0.0,
                permissible_limit=0.0,
                unit="m",
                details=f"Side setbacks not mandated for small plots ({plot_area} sq.m).",
                source_citation=citation,
                rule_version=self.rule_version,
            )

        side1 = info.setbacks.side1_m.value
        side2 = info.setbacks.side2_m.value

        if side1 is None and side2 is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=required_side,
                unit="m",
                details=f"Required side setback is {required_side} m, but neither side setback is specified.",
                source_citation=citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["setbacks.side1_m", "setbacks.side2_m"],
            )

        min_measured_side = min([s for s in (side1, side2) if s is not None])
        if min_measured_side >= required_side:
            status = RuleStatus.PASS
            details = (
                f"Side setbacks (Side 1: {side1 or 'N/A'} m, Side 2: {side2 or 'N/A'} m) satisfy "
                f"the required minimum of {required_side:.2f} m for {occupancy.value if occupancy else 'building'}."
            )
        else:
            status = RuleStatus.FAIL
            deficit = round(required_side - min_measured_side, 2)
            details = (
                f"Side setback of {min_measured_side:.2f} m is deficient by {deficit} m "
                f"(statutory minimum is {required_side:.2f} m for fire tender access)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=min_measured_side,
            permissible_limit=required_side,
            unit="m",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
