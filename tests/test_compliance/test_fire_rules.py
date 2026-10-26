"""
Unit tests for deterministic Fire and Life Safety compliance rules.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleStatus
from nirmantra_ai.compliance.rules.fire_safety import (
    FireDetectionEquipmentRule,
    FireServiceClearanceRule,
    StaircaseWidthRule,
)
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    FireSafetyData,
    OccupancyType,
)


class TestFireServiceClearanceRule:
    def test_dfs_clearance_triggered_above_15m(self) -> None:
        rule = FireServiceClearanceRule()
        info = BuildingInfo(building_height_m=FieldProvenance.explicit(16.5))
        res = rule.evaluate(info)
        assert res.status == RuleStatus.NEEDS_REVIEW
        assert res.requires_human_review is True
        assert "exceeds 15.0 m" in res.details

    def test_dfs_clearance_not_triggered_under_15m(self) -> None:
        rule = FireServiceClearanceRule()
        info = BuildingInfo(building_height_m=FieldProvenance.explicit(14.0))
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS


class TestStaircaseWidthRule:
    def test_staircase_width_pass_residential(self) -> None:
        rule = StaircaseWidthRule()
        info = BuildingInfo(
            building_height_m=FieldProvenance.explicit(16.0),
            occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.3)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS

    def test_staircase_width_fail_commercial(self) -> None:
        rule = StaircaseWidthRule()
        # Commercial requires 1.5m, provided is 1.2m
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.COMMERCIAL),
            fire_safety=FireSafetyData(staircase_width_m=FieldProvenance.explicit(1.2)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "deficient by 0.3" in res.details


class TestFireDetectionEquipmentRule:
    def test_fire_detection_pass(self) -> None:
        rule = FireDetectionEquipmentRule()
        info = BuildingInfo(
            building_height_m=FieldProvenance.explicit(18.0),
            fire_safety=FireSafetyData(
                fire_extinguishers_present=FieldProvenance.explicit(True),
                fire_alarm_present=FieldProvenance.explicit(True),
            ),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS

    def test_fire_detection_fail_missing_alarm(self) -> None:
        rule = FireDetectionEquipmentRule()
        info = BuildingInfo(
            building_height_m=FieldProvenance.explicit(18.0),
            fire_safety=FireSafetyData(
                fire_extinguishers_present=FieldProvenance.explicit(True),
                fire_alarm_present=FieldProvenance.explicit(False),
            ),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "Fire Alarm System" in res.details
