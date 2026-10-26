"""
Tests for BuildingInfo and FieldProvenance data models.
"""

from __future__ import annotations

from nirmantra_ai.document.models import Confidence
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    OccupancyType,
)


class TestFieldProvenance:
    """Test provenance factories and state."""

    def test_explicit_factory(self) -> None:
        field = FieldProvenance.explicit(
            value=250.0,
            raw_snippet="250 sq. m.",
            page_number=1,
            confidence=Confidence.HIGH,
        )
        assert field.value == 250.0
        assert field.raw_snippet == "250 sq. m."
        assert field.page_number == 1
        assert field.confidence == Confidence.HIGH
        assert field.is_inferred is False

    def test_inferred_factory(self) -> None:
        field = FieldProvenance.inferred(
            value=4,
            raw_snippet="Ground plus 3 floors",
            page_number=2,
            confidence=Confidence.MEDIUM,
        )
        assert field.value == 4
        assert field.is_inferred is True
        assert field.confidence == Confidence.MEDIUM

    def test_missing_factory(self) -> None:
        field: FieldProvenance[float] = FieldProvenance.missing()
        assert field.value is None
        assert field.confidence == Confidence.UNKNOWN
        assert field.is_inferred is False


class TestBuildingInfo:
    """Test model defaults and serialization."""

    def test_default_empty_building_info(self) -> None:
        info = BuildingInfo()
        assert info.plot_area_sqm.value is None
        assert info.total_builtup_area_sqm.value is None
        assert info.has_critical_dimensions is False
        assert info.occupancy_type.value is None

    def test_critical_dimensions_detected(self) -> None:
        info = BuildingInfo(
            plot_area_sqm=FieldProvenance.explicit(500.0),
            total_builtup_area_sqm=FieldProvenance.explicit(1200.0),
        )
        assert info.has_critical_dimensions is True

    def test_round_trip_serialization(self) -> None:
        info = BuildingInfo(
            project_name=FieldProvenance.explicit("Apex Tower"),
            occupancy_type=FieldProvenance.explicit(OccupancyType.COMMERCIAL),
            plot_area_sqm=FieldProvenance.explicit(1500.0),
        )
        dumped = info.model_dump()
        restored = BuildingInfo.model_validate(dumped)
        assert restored.project_name.value == "Apex Tower"
        assert restored.occupancy_type.value == OccupancyType.COMMERCIAL
        assert restored.plot_area_sqm.value == 1500.0
