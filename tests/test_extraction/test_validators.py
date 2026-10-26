"""
Tests for unit conversion and physical sanity validation.
"""

from __future__ import annotations

import pytest

from nirmantra_ai.extraction.models import BuildingInfo, FieldProvenance
from nirmantra_ai.extraction.validators import (
    convert_area_to_sqm,
    convert_length_to_metres,
    validate_building_info_sanity,
)


class TestUnitConversions:
    """Test standard Indian and metric conversions."""

    def test_sqm_direct_return(self) -> None:
        res = convert_area_to_sqm(100.0, "sq. m")
        assert res.value_metric == 100.0
        assert res.original_unit == "sq. m"

    def test_sqft_to_sqm(self) -> None:
        # 1000 sq ft is approx 92.903 sq m
        res = convert_area_to_sqm(1000.0, "sq.ft")
        assert round(res.value_metric, 2) == 92.90

    def test_sq_yards_and_gaj_to_sqm(self) -> None:
        # 100 gaj / sq yards is approx 83.61 sq m
        res = convert_area_to_sqm(100.0, "gaj")
        assert round(res.value_metric, 2) == 83.61

        res2 = convert_area_to_sqm(100.0, "sq.yd")
        assert round(res2.value_metric, 2) == 83.61

    def test_unrecognized_area_unit_raises(self) -> None:
        with pytest.raises(ValueError, match="Unrecognized area unit"):
            convert_area_to_sqm(100.0, "lightyears")

    def test_metres_direct_return(self) -> None:
        res = convert_length_to_metres(15.0, "m")
        assert res.value_metric == 15.0

    def test_feet_to_metres(self) -> None:
        # 10 feet is 3.048 metres
        res = convert_length_to_metres(10.0, "ft")
        assert round(res.value_metric, 3) == 3.048

    def test_unrecognized_length_unit_raises(self) -> None:
        with pytest.raises(ValueError, match="Unrecognized length unit"):
            convert_length_to_metres(10.0, "parsecs")


class TestSanityValidation:
    """Test physical consistency checks."""

    def test_valid_building_has_no_issues(self) -> None:
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(500.0),
            total_builtup_area_sqm=FieldProvenance.explicit(1000.0),
            ground_coverage_sqm=FieldProvenance.explicit(250.0),
            building_height_m=FieldProvenance.explicit(12.0),
            number_of_floors=FieldProvenance.explicit(4),
        )
        issues = validate_building_info_sanity(info)
        assert len(issues) == 0

    def test_negative_values_detected(self) -> None:
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(-500.0),
        )
        issues = validate_building_info_sanity(info)
        assert any(i.severity == "ERROR" and "Negative value" in i.message for i in issues)

    def test_ground_coverage_exceeding_plot_area(self) -> None:
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(400.0),
            ground_coverage_sqm=FieldProvenance.explicit(450.0),
        )
        issues = validate_building_info_sanity(info)
        assert any("cannot exceed plot area" in i.message for i in issues)

    def test_unreasonable_floor_height_warns(self) -> None:
        # 50m building with 2 floors = 25m per floor -> warning
        info = BuildingInfo(
            building_height_m=FieldProvenance.explicit(50.0),
            number_of_floors=FieldProvenance.explicit(2),
        )
        issues = validate_building_info_sanity(info)
        assert any(i.severity == "WARNING" and "outside typical" in i.message for i in issues)
