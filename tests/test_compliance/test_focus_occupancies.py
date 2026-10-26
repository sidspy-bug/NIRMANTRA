"""
Comprehensive unit tests for the four core focal building occupancies:
1. Educational Buildings
2. Hospitals & Healthcare Facilities
3. Hotels & Commercial Guest Accommodation
4. Shopping Centers & Mercantile Malls

Tests statutory rules against Delhi UBBL-2016, DFS Act/Rules, and MPD-2021.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.compliance.engine import ComplianceEngine, get_focus_occupancy_rules
from nirmantra_ai.compliance.models import RuleStatus
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
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    FireSafetyData,
    OccupancyType,
    SetbackData,
)


# ==============================================================================
# 1. EDUCATIONAL BUILDINGS
# ==============================================================================
class TestEducationalBuildingCompliance:
    """Statutory tests for Educational Buildings (Schools, Colleges, Universities)."""

    def test_educational_staircase_width(self) -> None:
        rule = StaircaseWidthRule()
        # Educational requires min 1.50m (Table 8.1)
        info_pass = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.50)),
        )
        res_pass = rule.evaluate(info_pass)
        assert res_pass.status == RuleStatus.PASS
        assert res_pass.permissible_limit == 1.50

        info_fail = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.20)),
        )
        res_fail = rule.evaluate(info_fail)
        assert res_fail.status == RuleStatus.FAIL
        assert "deficient by 0.3" in res_fail.details

    def test_educational_dfs_clearance_trigger(self) -> None:
        rule = FireServiceClearanceRule()
        # Educational height > 9.0m triggers DFS NOC under DFS Rules Rule 27
        info_trigger = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            building_height_m=FieldProvenance.explicit(10.5),
        )
        res_trigger = rule.evaluate(info_trigger)
        assert res_trigger.status == RuleStatus.NEEDS_REVIEW
        assert res_trigger.requires_human_review is True
        assert res_trigger.permissible_limit == 9.0
        assert "Educational Building" in res_trigger.details

        info_safe = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            building_height_m=FieldProvenance.explicit(8.5),
        )
        res_safe = rule.evaluate(info_safe)
        assert res_safe.status == RuleStatus.PASS

    def test_educational_far_and_coverage(self) -> None:
        far_rule = FloorAreaRatioRule()
        cov_rule = GroundCoverageRule()

        # Plot 4000 sqm, built-up 6000 sqm -> FAR 150 (road < 24m), Coverage max 35%
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            plot_area_sqm=FieldProvenance.explicit(4000.0),
            total_builtup_area_sqm=FieldProvenance.explicit(6000.0),
            ground_coverage_sqm=FieldProvenance.explicit(1400.0),  # 35% exactly
            road_width_m=FieldProvenance.explicit(18.0),
        )
        far_res = far_rule.evaluate(info)
        assert far_res.status == RuleStatus.PASS
        assert far_res.permissible_limit == 150.0

        cov_res = cov_rule.evaluate(info)
        assert cov_res.status == RuleStatus.PASS
        assert cov_res.permissible_limit == 35.0

    def test_educational_parking_ecs(self) -> None:
        rule = CommercialParkingRule()
        # 6000 sqm built-up @ 1.5 ECS/100 sqm = 90 ECS required
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.EDUCATIONAL),
            total_builtup_area_sqm=FieldProvenance.explicit(6000.0),
            parking_spaces_provided=FieldProvenance.explicit(95),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.permissible_limit == 90.0


# ==============================================================================
# 2. HOSPITALS & HEALTHCARE FACILITIES
# ==============================================================================
class TestHospitalCompliance:
    """Statutory tests for Hospitals and Healthcare Facilities."""

    def test_hospital_staircase_width_requires_2m(self) -> None:
        rule = StaircaseWidthRule()
        # Hospital exit staircases must be min 2.00m (Table 8.1) for stretcher movement
        info_2m = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(2.00)),
        )
        res_pass = rule.evaluate(info_2m)
        assert res_pass.status == RuleStatus.PASS
        assert res_pass.permissible_limit == 2.00

        info_narrow = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.50)),
        )
        res_fail = rule.evaluate(info_narrow)
        assert res_fail.status == RuleStatus.FAIL
        assert "deficient by 0.5" in res_fail.details

    def test_hospital_safety_corridor_and_ramp(self) -> None:
        rule = HospitalSafetyRule()
        # Min corridor 2.40m and ramp provided
        info_compliant = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            fire_safety=FireSafetyData(
                corridor_width_m=FieldProvenance.explicit(2.50),
                ramp_provided=FieldProvenance.explicit(True),
            ),
        )
        res_comp = rule.evaluate(info_compliant)
        assert res_comp.status == RuleStatus.PASS
        assert res_comp.permissible_limit == 2.40

        info_narrow_corridor = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            fire_safety=FireSafetyData(
                corridor_width_m=FieldProvenance.explicit(2.00),
                ramp_provided=FieldProvenance.explicit(True),
            ),
        )
        res_narrow = rule.evaluate(info_narrow_corridor)
        assert res_narrow.status == RuleStatus.FAIL
        assert "Corridor width 2.00 m is deficient" in res_narrow.details

        info_no_ramp = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            fire_safety=FireSafetyData(
                corridor_width_m=FieldProvenance.explicit(2.40),
                ramp_provided=FieldProvenance.explicit(False),
            ),
        )
        res_no_ramp = rule.evaluate(info_no_ramp)
        assert res_no_ramp.status == RuleStatus.FAIL
        assert "ramp is missing" in res_no_ramp.details

    def test_hospital_dfs_clearance_trigger(self) -> None:
        rule = FireServiceClearanceRule()
        # Hospital height > 9.0m triggers DFS NOC
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            building_height_m=FieldProvenance.explicit(12.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.NEEDS_REVIEW
        assert res.permissible_limit == 9.0
        assert "Hospital" in res.details

    def test_hospital_parking_ecs(self) -> None:
        rule = CommercialParkingRule()
        # 10,000 sqm built-up @ 2.0 ECS/100 sqm = 200 ECS required
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            total_builtup_area_sqm=FieldProvenance.explicit(10000.0),
            parking_spaces_provided=FieldProvenance.explicit(180),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "deficient by 20 ECS" in res.details


# ==============================================================================
# 3. HOTELS
# ==============================================================================
class TestHotelCompliance:
    """Statutory tests for Commercial Hotels and Guest Accommodations."""

    def test_hotel_staircase_width(self) -> None:
        rule = StaircaseWidthRule()
        # Hotels require min 1.50m staircase (Table 8.1)
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOTEL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.50)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.permissible_limit == 1.50

    def test_hotel_dfs_clearance_trigger_above_12m(self) -> None:
        rule = FireServiceClearanceRule()
        # Hotels > 12.0m trigger DFS NOC under DFS Rules Rule 27
        info_trigger = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOTEL),
            building_height_m=FieldProvenance.explicit(13.5),
        )
        res = rule.evaluate(info_trigger)
        assert res.status == RuleStatus.NEEDS_REVIEW
        assert res.permissible_limit == 12.0
        assert "Hotel" in res.details

        info_low = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOTEL),
            building_height_m=FieldProvenance.explicit(11.0),
        )
        assert rule.evaluate(info_low).status == RuleStatus.PASS

    def test_hotel_parking_ecs_3_per_100sqm(self) -> None:
        rule = CommercialParkingRule()
        # Hotel requires 3.0 ECS / 100 sqm. 5,000 sqm -> 150 spaces required.
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOTEL),
            total_builtup_area_sqm=FieldProvenance.explicit(5000.0),
            parking_spaces_provided=FieldProvenance.explicit(155),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.permissible_limit == 150.0

    def test_hotel_far_and_coverage(self) -> None:
        far_rule = FloorAreaRatioRule()
        cov_rule = GroundCoverageRule()

        # Road >= 24m -> max FAR 325. Coverage max 40%.
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOTEL),
            plot_area_sqm=FieldProvenance.explicit(2000.0),
            total_builtup_area_sqm=FieldProvenance.explicit(6000.0),  # FAR = 300
            ground_coverage_sqm=FieldProvenance.explicit(750.0),      # Coverage = 37.5%
            road_width_m=FieldProvenance.explicit(24.0),
        )
        assert far_rule.evaluate(info).status == RuleStatus.PASS
        assert cov_rule.evaluate(info).status == RuleStatus.PASS


# ==============================================================================
# 4. SHOPPING CENTERS & MERCANTILE MALLS
# ==============================================================================
class TestShoppingCenterCompliance:
    """Statutory tests for Shopping Centers and Commercial Complexes."""

    def test_shopping_center_staircase_requires_2m(self) -> None:
        rule = StaircaseWidthRule()
        # Shopping center staircase width must be min 2.00m (Table 8.1)
        info_pass = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(2.00)),
        )
        res_pass = rule.evaluate(info_pass)
        assert res_pass.status == RuleStatus.PASS
        assert res_pass.permissible_limit == 2.00

        info_fail = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.60)),
        )
        res_fail = rule.evaluate(info_fail)
        assert res_fail.status == RuleStatus.FAIL
        assert "deficient by 0.4" in res_fail.details

    def test_shopping_center_travel_distance_and_exits(self) -> None:
        rule = ShoppingCenterExitRule()
        # Max travel distance <= 30.0m and at least 2 independent staircases
        info_compliant = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            fire_safety=FireSafetyData(
                travel_distance_to_exit_m=FieldProvenance.explicit(26.5),
                number_of_staircases=FieldProvenance.explicit(3),
            ),
        )
        res_comp = rule.evaluate(info_compliant)
        assert res_comp.status == RuleStatus.PASS
        assert res_comp.permissible_limit == 30.0

        info_excess_distance = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            fire_safety=FireSafetyData(
                travel_distance_to_exit_m=FieldProvenance.explicit(36.0),
                number_of_staircases=FieldProvenance.explicit(2),
            ),
        )
        res_excess = rule.evaluate(info_excess_distance)
        assert res_excess.status == RuleStatus.FAIL
        assert "exceeds statutory maximum of 30.0 m by 6.0" in res_excess.details

        info_single_staircase = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            fire_safety=FireSafetyData(
                travel_distance_to_exit_m=FieldProvenance.explicit(22.0),
                number_of_staircases=FieldProvenance.explicit(1),
            ),
        )
        res_single = rule.evaluate(info_single_staircase)
        assert res_single.status == RuleStatus.FAIL
        assert "minimum 2 independent staircases required" in res_single.details

    def test_shopping_center_dfs_clearance_by_height_and_area(self) -> None:
        rule = FireServiceClearanceRule()
        # Triggered if height > 9.0m
        info_ht = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            building_height_m=FieldProvenance.explicit(11.0),
            total_builtup_area_sqm=FieldProvenance.explicit(400.0),
        )
        assert rule.evaluate(info_ht).status == RuleStatus.NEEDS_REVIEW

        # Triggered even if low-rise (e.g. 7m) if covered area > 500 sqm
        info_area = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            building_height_m=FieldProvenance.explicit(7.0),
            total_builtup_area_sqm=FieldProvenance.explicit(1200.0),
        )
        res_area = rule.evaluate(info_area)
        assert res_area.status == RuleStatus.NEEDS_REVIEW
        assert "Covered area of 1200.0 sq.m exceeds 500.0 sq.m" in res_area.details

    def test_shopping_center_parking_ecs(self) -> None:
        rule = CommercialParkingRule()
        # 3.0 ECS / 100 sqm -> 4000 sqm requires 120 spaces
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            total_builtup_area_sqm=FieldProvenance.explicit(4000.0),
            parking_spaces_provided=FieldProvenance.explicit(125),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.permissible_limit == 120.0


# ==============================================================================
# 5. ENGINE ORCHESTRATION WITH FOCAL OCCUPANCIES
# ==============================================================================
class TestEngineFocalOccupancyOrchestration:
    """Validates that ComplianceEngine auto-activates all relevant specialized rules for focal buildings."""

    def test_engine_evaluates_hospital_with_specialized_rules(self) -> None:
        engine = ComplianceEngine()
        hospital = BuildingInfo(
            project_name=FieldProvenance.explicit("Max Care Multi-Speciality Hospital"),
            occupancy_type=FieldProvenance.explicit(OccupancyType.HOSPITAL),
            plot_area_sqm=FieldProvenance.explicit(3000.0),
            total_builtup_area_sqm=FieldProvenance.explicit(6500.0),  # FAR = 216.7 <= 250 (PASS)
            ground_coverage_sqm=FieldProvenance.explicit(950.0),      # 31.7% <= 35% (PASS)
            building_height_m=FieldProvenance.explicit(18.0),         # > 9m triggers DFS (NEEDS_REVIEW)
            road_width_m=FieldProvenance.explicit(18.0),
            parking_spaces_provided=FieldProvenance.explicit(135),    # 6500 * 2.0/100 = 130 (PASS)
            setbacks=SetbackData(
                front_m=FieldProvenance.explicit(12.5),               # >= 12.0m for 3000sqm plot (PASS)
                rear_m=FieldProvenance.explicit(9.5),                 # >= 9.0m (PASS)
                side1_m=FieldProvenance.explicit(6.2),                # >= 6.0m driveway (PASS)
                side2_m=FieldProvenance.explicit(6.0),                # >= 6.0m driveway (PASS)
            ),
            fire_safety=FireSafetyData(
                staircase_width_m=FieldProvenance.explicit(2.10),     # >= 2.00m (PASS)
                corridor_width_m=FieldProvenance.explicit(2.50),      # >= 2.40m (PASS)
                ramp_provided=FieldProvenance.explicit(True),         # Evacuation ramp (PASS)
                fire_extinguishers_present=FieldProvenance.explicit(True),
                fire_alarm_present=FieldProvenance.explicit(True),
            ),
        )

        summary = engine.evaluate(hospital)

        # Evaluated rules should include: Front, Rear, Side, FAR, Coverage, DFS, Staircase, Equipment, Hospital Safety, Parking
        rule_ids = {r.rule_id for r in summary.results}
        assert "DELHI_UBBL_2016_HOSPITAL_SAFETY" in rule_ids
        assert "DELHI_UBBL_2016_PARKING_ECS" in rule_ids
        assert "DELHI_UBBL_2016_SETBACK_SIDE" in rule_ids
        assert "DELHI_UBBL_2016_FIRE_STAIRCASE_WIDTH" in rule_ids

        # Hospital staircase evaluated against 2.0m
        staircase_res = next(r for r in summary.results if r.rule_id == "DELHI_UBBL_2016_FIRE_STAIRCASE_WIDTH")
        assert staircase_res.permissible_limit == 2.00
        assert staircase_res.status == RuleStatus.PASS

        # Hospital safety rule passed
        hosp_res = next(r for r in summary.results if r.rule_id == "DELHI_UBBL_2016_HOSPITAL_SAFETY")
        assert hosp_res.status == RuleStatus.PASS

    def test_engine_evaluates_shopping_center_with_specialized_rules(self) -> None:
        engine = ComplianceEngine()
        mall = BuildingInfo(
            project_name=FieldProvenance.explicit("Pacific Galleria Mall"),
            occupancy_type=FieldProvenance.explicit(OccupancyType.SHOPPING_CENTER),
            plot_area_sqm=FieldProvenance.explicit(5000.0),
            total_builtup_area_sqm=FieldProvenance.explicit(9000.0),  # FAR = 180 <= 200 (PASS)
            ground_coverage_sqm=FieldProvenance.explicit(1900.0),     # 38% <= 40% (PASS)
            building_height_m=FieldProvenance.explicit(14.0),
            parking_spaces_provided=FieldProvenance.explicit(280),    # 9000 * 3.0/100 = 270 (PASS)
            setbacks=SetbackData(
                front_m=FieldProvenance.explicit(12.5),
                rear_m=FieldProvenance.explicit(9.5),
                side1_m=FieldProvenance.explicit(6.5),
                side2_m=FieldProvenance.explicit(6.5),
            ),
            fire_safety=FireSafetyData(
                staircase_width_m=FieldProvenance.explicit(2.20),
                travel_distance_to_exit_m=FieldProvenance.explicit(25.0),
                number_of_staircases=FieldProvenance.explicit(4),
                fire_extinguishers_present=FieldProvenance.explicit(True),
                fire_alarm_present=FieldProvenance.explicit(True),
            ),
        )

        summary = engine.evaluate(mall)
        rule_ids = {r.rule_id for r in summary.results}
        assert "DELHI_UBBL_2016_SHOPPING_CENTER_EXIT" in rule_ids
        assert "DELHI_UBBL_2016_PARKING_ECS" in rule_ids
        assert "DELHI_UBBL_2016_SETBACK_SIDE" in rule_ids

        exit_res = next(r for r in summary.results if r.rule_id == "DELHI_UBBL_2016_SHOPPING_CENTER_EXIT")
        assert exit_res.status == RuleStatus.PASS
