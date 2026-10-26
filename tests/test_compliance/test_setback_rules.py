"""
Unit tests for deterministic Front and Rear Setback rules under UBBL 2016.
"""

from __future__ import annotations

from nirmantra_ai.compliance.models import RuleStatus
from nirmantra_ai.compliance.rules.setback import FrontSetbackRule, RearSetbackRule
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    OccupancyType,
    SetbackData,
)


class TestFrontSetbackRule:
    """Tests for FrontSetbackRule."""

    def test_front_setback_pass(self) -> None:
        rule = FrontSetbackRule()
        # For plot 500 sqm, required is 6.0m
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
            plot_area_sqm=FieldProvenance.explicit(500.0),
            setbacks=SetbackData(front_m=FieldProvenance.explicit(6.5)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.measured_value == 6.5
        assert res.permissible_limit == 6.0

    def test_front_setback_fail_with_deficit(self) -> None:
        rule = FrontSetbackRule()
        # For plot 500 sqm, required is 6.0m, provided is 4.5m -> Deficit 1.5m
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
            plot_area_sqm=FieldProvenance.explicit(500.0),
            setbacks=SetbackData(front_m=FieldProvenance.explicit(4.5)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "deficient by 1.5" in res.details
        assert res.requires_human_review is True

    def test_front_setback_missing_plot_area_needs_review(self) -> None:
        rule = FrontSetbackRule()
        info = BuildingInfo(
            setbacks=SetbackData(front_m=FieldProvenance.explicit(6.0)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.NEEDS_REVIEW
        assert "plot_area_sqm" in res.missing_evidence_fields

    def test_front_setback_not_applicable_to_commercial(self) -> None:
        rule = FrontSetbackRule()
        info = BuildingInfo(
            occupancy_type=FieldProvenance.explicit(OccupancyType.COMMERCIAL),
            plot_area_sqm=FieldProvenance.explicit(500.0),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.NOT_APPLICABLE


class TestRearSetbackRule:
    """Tests for RearSetbackRule."""

    def test_rear_setback_small_plot_pass(self) -> None:
        rule = RearSetbackRule()
        # Plot 200 sqm -> Required is 2.0m
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(200.0),
            setbacks=SetbackData(rear_m=FieldProvenance.explicit(2.5)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.PASS
        assert res.permissible_limit == 2.0

    def test_rear_setback_fail(self) -> None:
        rule = RearSetbackRule()
        # Plot 400 sqm -> Required is 3.0m, provided is 1.8m
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(400.0),
            setbacks=SetbackData(rear_m=FieldProvenance.explicit(1.8)),
        )
        res = rule.evaluate(info)
        assert res.status == RuleStatus.FAIL
        assert "deficient by 1.2" in res.details
