"""
Deterministic Fire and Life Safety compliance rules for Delhi NCT.

Based on Unified Building Bye-Laws for Delhi 2016 (Clause 9.3, 9.5),
Delhi Fire Service (DFS) Act & Rules, and NBC 2016 Part 4.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class FireServiceClearanceRule(ComplianceRule):
    """Evaluates whether building height, occupancy, or area triggers mandatory Delhi Fire Service (DFS) NOC."""

    rule_id = "DELHI_DFS_CLEARANCE_REQUIRED"
    rule_name = "Delhi Fire Service (DFS) Clearance Trigger"
    category = RegulatoryCategory.FIRE_SAFETY
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 9.3 & Delhi Fire Service Rules (Rule 27 / Rule 33)"
    rule_version = "DFS-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        height = info.building_height_m.value
        occupancy = info.occupancy_type.value
        builtup_area = info.total_builtup_area_sqm.value or 0.0

        if height is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details="Building height is missing; cannot verify if Delhi Fire Service Clearance is triggered.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["building_height_m"],
            )

        citation = self.source_citation
        # Statutory height thresholds under Delhi Fire Service Rules 2010 & UBBL-2016 Clause 9.3
        if occupancy == OccupancyType.EDUCATIONAL:
            threshold_height = 9.0
            occ_label = "Educational Building (School/College/Institute)"
            citation = "Delhi Fire Service Rules 2010 (Rule 27) & UBBL-2016 Clause 9.3 (Educational > 9.0 m requires DFS NOC)"
        elif occupancy == OccupancyType.HOSPITAL:
            threshold_height = 9.0
            occ_label = "Hospital / Healthcare Facility"
            citation = "Delhi Fire Service Rules 2010 (Rule 27) & UBBL-2016 Clause 9.3 (Hospitals & Healthcare Facilities DFS Clearance)"
        elif occupancy == OccupancyType.HOTEL:
            threshold_height = 12.0
            occ_label = "Hotel / Guest House"
            citation = "Delhi Fire Service Rules 2010 (Rule 27) & UBBL-2016 Clause 9.3 (Hotels > 12.0 m require DFS NOC)"
        elif occupancy == OccupancyType.SHOPPING_CENTER:
            threshold_height = 9.0
            occ_label = "Shopping Center / Commercial Mall"
            citation = "Delhi Fire Service Rules 2010 (Rule 27) & UBBL-2016 Clause 9.3 (Mercantile / Shopping Centers DFS Clearance)"
        else:
            threshold_height = 15.0
            occ_label = "Building"

        # Check Shopping Center area trigger (covered area > 500 sqm triggers DFS even if low rise)
        area_triggered = occupancy == OccupancyType.SHOPPING_CENTER and builtup_area > 500.0

        if height > threshold_height or area_triggered:
            trigger_reason = (
                f"Building height of {height:.2f} m exceeds {threshold_height:.1f} m"
                if height > threshold_height
                else f"Covered area of {builtup_area:.1f} sq.m exceeds 500.0 sq.m"
            )
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                measured_value=height,
                permissible_limit=threshold_height,
                unit="m",
                details=(
                    f"{occ_label}: {trigger_reason}. Mandatory Prior Fire Clearance / NOC "
                    "from the Delhi Fire Service (DFS) is legally required before approval/occupancy."
                ),
                source_citation=citation,
                rule_version=self.rule_version,
                requires_human_review=True,
            )
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.PASS,
                measured_value=height,
                permissible_limit=threshold_height,
                unit="m",
                details=(
                    f"{occ_label} height of {height:.2f} m does not exceed {threshold_height:.1f} m threshold. "
                    "Routine DFS high-hazard / high-rise clearance trigger does not apply."
                ),
                source_citation=citation,
                rule_version=self.rule_version,
            )


class StaircaseWidthRule(ComplianceRule):
    """Evaluates emergency exit staircase width under UBBL 2016 Table 8.1 & Clause 9.3."""

    rule_id = "DELHI_UBBL_2016_FIRE_STAIRCASE_WIDTH"
    rule_name = "Minimum Emergency Staircase Width"
    category = RegulatoryCategory.FIRE_SAFETY
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Table 8.1 & Clause 9.3"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        measured_width = info.fire_safety.staircase_width_m.value
        occupancy = info.occupancy_type.value or OccupancyType.RESIDENTIAL
        height = info.building_height_m.value or 0.0

        citation = self.source_citation
        # Table 8.1 Minimum width of common staircase / exit for Delhi NCT
        if occupancy == OccupancyType.HOSPITAL:
            required_width = 2.0
            citation = "Unified Building Bye-Laws for Delhi 2016, Table 8.1 (Hospitals / Healthcare: Min 2.00 m)"
        elif occupancy == OccupancyType.SHOPPING_CENTER:
            required_width = 2.0
            citation = "Unified Building Bye-Laws for Delhi 2016, Table 8.1 (Shopping Centers / Mercantile: Min 2.00 m)"
        elif occupancy in {OccupancyType.EDUCATIONAL, OccupancyType.HOTEL, OccupancyType.COMMERCIAL}:
            required_width = 1.5
            citation = f"Unified Building Bye-Laws for Delhi 2016, Table 8.1 ({occupancy.value.title()}: Min 1.50 m)"
        elif height > 15.0:
            required_width = 1.25  # High-rise residential
        else:
            required_width = 1.0  # Low-rise residential plotted

        if measured_width is None:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                permissible_limit=required_width,
                unit="m",
                details=f"Required minimum staircase width is {required_width} m, but staircase width is not stated in documents.",
                source_citation=citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=["fire_safety.staircase_width_m"],
            )

        if measured_width >= required_width:
            status = RuleStatus.PASS
            details = (
                f"Emergency staircase width of {measured_width:.2f} m meets or exceeds "
                f"the required {required_width:.2f} m minimum."
            )
        else:
            status = RuleStatus.FAIL
            deficit = round(required_width - measured_width, 2)
            details = (
                f"Emergency staircase width of {measured_width:.2f} m is deficient by {deficit} m "
                f"(minimum required is {required_width:.2f} m)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=measured_width,
            permissible_limit=required_width,
            unit="m",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )


class FireDetectionEquipmentRule(ComplianceRule):
    """Evaluates presence of fire extinguishers and alarms under UBBL Clause 9.5 & NBC 2016 Part 4."""

    rule_id = "DELHI_UBBL_2016_FIRE_EQUIPMENT"
    rule_name = "Fire Detection and Extinguisher Equipment"
    category = RegulatoryCategory.FIRE_SAFETY
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Clause 9.5 & NBC 2016 Part 4"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        height = info.building_height_m.value or 0.0
        plot_area = info.plot_area_sqm.value or 0.0
        occupancy = info.occupancy_type.value

        # For Hospitals, Hotels, Shopping Centers, fire detection is always mandatory
        if occupancy in {OccupancyType.HOSPITAL, OccupancyType.HOTEL, OccupancyType.SHOPPING_CENTER}:
            is_mandatory = True
        elif occupancy == OccupancyType.EDUCATIONAL:
            is_mandatory = height > 9.0 or plot_area > 500.0
        else:
            is_mandatory = height > 15.0 or plot_area > 500.0

        if not is_mandatory:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details="Building under threshold; specialized automatic fire detection not mandatory.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        extinguishers = info.fire_safety.fire_extinguishers_present.value
        alarm = info.fire_safety.fire_alarm_present.value

        missing = []
        if extinguishers is None:
            missing.append("fire_safety.fire_extinguishers_present")
        if alarm is None:
            missing.append("fire_safety.fire_alarm_present")

        if missing:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details="Fire safety provisions cannot be confirmed; missing evidence for extinguishers or alarm system.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing,
            )

        if extinguishers and alarm:
            status = RuleStatus.PASS
            details = "Both portable fire extinguishers and an automatic fire alarm system are documented."
        else:
            status = RuleStatus.FAIL
            missing_items = []
            if not extinguishers:
                missing_items.append("Fire Extinguishers")
            if not alarm:
                missing_items.append("Fire Alarm System")
            details = f"Mandatory fire equipment missing from plan: {', '.join(missing_items)}."

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            details=details,
            source_citation=self.source_citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
