"""
Unit tests for deterministic Floor Area Ratio (FAR) and Ground Coverage rules.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleStatus
from nirmantra_ai.compliance.rules.far import FloorAreaRatioRule, GroundCoverageRule
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    OccupancyType,
)


class TestFloorAreaRatioRule:
    """Tests for FloorAreaRatioRule."""

    def test_far_pass(self) -> None:
        rule = FloorAreaRatioRule()
        # Plot 400 sqm (max FAR 225)
        # Built-up 800 sqm -> FAR = (800/400)*100 = 200.0 <= 225
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
            plot_area_sqm=FieldProvenance.explicit(400.0),
            total_builtup_area_sqm=FieldProvenance.explicit(800.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.measured_value == 200.0
        assert res.permissible_limit == 225.0

    def test_far_fail_with_excess(self) -> None:
        rule = FloorAreaRatioRule()
        # Plot 400 sqm (max FAR 225)
        # Built-up 1000 sqm -> FAR = (1000/400)*100 = 250.0 > 225 -> Excess 25
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
            plot_area_sqm=FieldProvenance.explicit(400.0),
            total_builtup_area_sqm=FieldProvenance.explicit(1000.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "exceeds" in res.details
        assert res.requires_human_review is True

    def test_far_missing_builtup_needs_review(self) -> None:
        rule = FloorAreaRatioRule()
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(400.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.NEEDS_REVIEW
        assert "total_builtup_area_sqm" in res.missing_evidence_fields


class TestGroundCoverageRule:
    """Tests for GroundCoverageRule."""

    def test_ground_coverage_pass(self) -> None:
        rule = GroundCoverageRule()
        # Plot 400 sqm (max 75%)
        # Coverage 260 sqm -> (260/400)*100 = 65% <= 75%
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(400.0),
            ground_coverage_sqm=FieldProvenance.explicit(260.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.measured_value == 65.0
        assert res.permissible_limit == 75.0

    def test_ground_coverage_fail(self) -> None:
        rule = GroundCoverageRule()
        # Plot 400 sqm (max 75%)
        # Coverage 320 sqm -> (320/400)*100 = 80% > 75%
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(400.0),
            ground_coverage_sqm=FieldProvenance.explicit(320.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "exceeds" in res.details
