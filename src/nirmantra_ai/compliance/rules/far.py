"""
Deterministic Floor Area Ratio (FAR) and Ground Coverage compliance rules.

Based on Unified Building Bye-Laws for Delhi 2016 (UBBL-2016), Table 7.1.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleResult, RuleStatus
from nirmantra_ai.compliance.rules.base import ComplianceRule
from nirmantra_ai.extraction.models import BuildingInfo, OccupancyType
from nirmantra_ai.knowledge.models import RegulatoryCategory


class FloorAreaRatioRule(ComplianceRule):
    """Evaluates Floor Area Ratio (FAR) against statutory maximums under UBBL Table 7.1."""

    rule_id = "DELHI_UBBL_2016_FAR_MAX"
    rule_name = "Maximum Permissible Floor Area Ratio (FAR)"
    category = RegulatoryCategory.FAR
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Table 7.1 (Residential Plotted)"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        missing_fields: list[str] = []
        plot_area = info.plot_area_sqm.value
        builtup_area = info.total_builtup_area_sqm.value

        if plot_area is None:
            missing_fields.append("plot_area_sqm")
        if builtup_area is None:
            missing_fields.append("total_builtup_area_sqm")

        if missing_fields:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details=f"Missing parameters required to calculate FAR: {', '.join(missing_fields)}.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing_fields,
            )

        if plot_area <= 0:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details=f"Invalid plot area: {plot_area} sq.m.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
            )

        citation = self.source_citation
        road_width = info.road_width_m.value or 0.0

        # Statutory max FAR thresholds for Delhi across target occupancies
        if occupancy == OccupancyType.EDUCATIONAL:
            max_far = 225.0 if road_width >= 24.0 else 150.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Institutional Development Controls (Educational)"
        elif occupancy == OccupancyType.HOSPITAL:
            max_far = 375.0 if road_width >= 24.0 else 250.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Health Infrastructure Controls (Hospitals)"
        elif occupancy == OccupancyType.HOTEL:
            max_far = 325.0 if road_width >= 24.0 else 225.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Commercial Controls (Hotels)"
        elif occupancy == OccupancyType.SHOPPING_CENTER:
            max_far = 200.0 if plot_area >= 2000.0 else 150.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Commercial Centers (Shopping Centers / Malls)"
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            if plot_area <= 100.0:
                max_far = 350.0
            elif plot_area <= 250.0:
                max_far = 300.0
            elif plot_area <= 500.0:
                max_far = 225.0
            elif plot_area <= 1000.0:
                max_far = 150.0
            else:
                max_far = 120.0
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"FAR table not applicable to {occupancy.value} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        # Delhi standard FAR calculation = (total built-up area / plot area) * 100
        calculated_far = round((builtup_area / plot_area) * 100.0, 2)

        if calculated_far <= max_far:
            status = RuleStatus.PASS
            details = (
                f"Calculated FAR of {calculated_far:.1f} (Built-up: {builtup_area} sq.m / Plot: {plot_area} sq.m) "
                f"is within the maximum permissible limit of {max_far:.1f}."
            )
        else:
            status = RuleStatus.FAIL
            excess = round(calculated_far - max_far, 1)
            details = (
                f"Calculated FAR of {calculated_far:.1f} exceeds the maximum permissible limit of {max_far:.1f} "
                f"by {excess} (statutory limit violated)."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=calculated_far,
            permissible_limit=max_far,
            unit="index",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )


class GroundCoverageRule(ComplianceRule):
    """Evaluates Ground Coverage percentage against statutory maximums under UBBL Table 7.1 and MPD 2021."""

    rule_id = "DELHI_UBBL_2016_GROUND_COVERAGE_MAX"
    rule_name = "Maximum Permissible Ground Coverage"
    category = RegulatoryCategory.GROUND_COVERAGE
    source_citation = "Unified Building Bye-Laws for Delhi 2016, Table 7.1"
    rule_version = "UBBL-2016-v1"

    def evaluate(self, info: BuildingInfo) -> RuleResult:
        occupancy = info.occupancy_type.value

        plot_area = info.plot_area_sqm.value
        ground_coverage = info.ground_coverage_sqm.value
        missing: list[str] = []

        if plot_area is None:
            missing.append("plot_area_sqm")
        if ground_coverage is None:
            missing.append("ground_coverage_sqm")

        if missing:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details=f"Cannot determine ground coverage compliance; missing: {', '.join(missing)}.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
                missing_evidence_fields=missing,
            )

        if plot_area <= 0:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NEEDS_REVIEW,
                details=f"Invalid plot area ({plot_area} sq.m).",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
                requires_human_review=True,
            )

        citation = self.source_citation

        # Max coverage percentages across focus building classifications
        if occupancy == OccupancyType.EDUCATIONAL:
            max_coverage_pct = 35.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Institutional Development Controls (Educational)"
        elif occupancy == OccupancyType.HOSPITAL:
            max_coverage_pct = 35.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Health Infrastructure Controls (Hospitals)"
        elif occupancy == OccupancyType.HOTEL:
            max_coverage_pct = 40.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Commercial Controls (Hotels)"
        elif occupancy == OccupancyType.SHOPPING_CENTER:
            max_coverage_pct = 40.0
            citation = "Master Plan for Delhi 2021 & UBBL 2016, Commercial Centers (Shopping Centers / Malls)"
        elif occupancy in {OccupancyType.RESIDENTIAL, OccupancyType.UNKNOWN, None}:
            if plot_area <= 100.0:
                max_coverage_pct = 90.0
            elif plot_area <= 250.0:
                max_coverage_pct = 85.0
            elif plot_area <= 500.0:
                max_coverage_pct = 75.0
            elif plot_area <= 1000.0:
                max_coverage_pct = 50.0
            else:
                max_coverage_pct = 40.0
        else:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.NOT_APPLICABLE,
                details=f"Ground coverage rule not applicable to {occupancy.value} occupancy.",
                source_citation=self.source_citation,
                rule_version=self.rule_version,
            )

        calculated_pct = round((ground_coverage / plot_area) * 100.0, 2)

        if calculated_pct <= max_coverage_pct:
            status = RuleStatus.PASS
            details = (
                f"Ground coverage of {ground_coverage} sq.m ({calculated_pct:.1f}%) is within "
                f"the permissible ceiling of {max_coverage_pct:.1f}% for plot {plot_area} sq.m."
            )
        else:
            status = RuleStatus.FAIL
            excess = round(calculated_pct - max_coverage_pct, 1)
            details = (
                f"Ground coverage of {ground_coverage} sq.m ({calculated_pct:.1f}%) exceeds "
                f"the statutory maximum of {max_coverage_pct:.1f}% by {excess}%."
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            status=status,
            measured_value=calculated_pct,
            permissible_limit=max_coverage_pct,
            unit="%",
            details=details,
            source_citation=citation,
            rule_version=self.rule_version,
            requires_human_review=status == RuleStatus.FAIL,
        )
