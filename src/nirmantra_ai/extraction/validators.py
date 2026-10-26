"""
Validation and unit conversion helpers for building extraction.

Converts common Indian real estate units (sq. ft, sq. yards/gaj, feet)
to standard metric units (sq. m, metres) and validates physical sanity.
"""

from __future__ import annotations

import logging
from typing import NamedTuple

from nirmantra_ai.extraction.models import BuildingInfo

logger = logging.getLogger(__name__)

# Standard conversion constants
SQFT_TO_SQM = 0.09290304
SQYARDS_TO_SQM = 0.83612736  # Also applies to Delhi 'Gaj'
FEET_TO_METRES = 0.3048


class ConversionResult(NamedTuple):
    value_metric: float
    original_value: float
    original_unit: str


def convert_area_to_sqm(value: float, unit: str) -> ConversionResult:
    """Convert an area measurement to square metres.

    Supported units: 'sqm', 'sq.m', 'sq m', 'sqft', 'sq.ft', 'sq ft',
                     'sqyd', 'sq.yd', 'sq yd', 'gaj', 'yards'.
    """
    clean_unit = unit.strip().lower().replace(" ", "").replace(".", "")
    if clean_unit in {"sqm", "m2", "sqmeter", "sqmeters", "squaremeter", "squaremeters"}:
        return ConversionResult(float(value), value, unit)
    elif clean_unit in {"sqft", "ft2", "squarefeet", "sqfeet"}:
        return ConversionResult(round(value * SQFT_TO_SQM, 4), value, unit)
    elif clean_unit in {"sqyd", "sqyard", "sqyards", "gaj", "yards", "yd2"}:
        return ConversionResult(round(value * SQYARDS_TO_SQM, 4), value, unit)
    else:
        raise ValueError(f"Unrecognized area unit: {unit!r}")


def convert_length_to_metres(value: float, unit: str) -> ConversionResult:
    """Convert a length or height measurement to metres.

    Supported units: 'm', 'metre', 'metres', 'meter', 'meters', 'ft', 'feet', 'foot'.
    """
    clean_unit = unit.strip().lower().replace(" ", "").replace(".", "")
    if clean_unit in {"m", "metre", "metres", "meter", "meters"}:
        return ConversionResult(float(value), value, unit)
    elif clean_unit in {"ft", "feet", "foot"}:
        return ConversionResult(round(value * FEET_TO_METRES, 4), value, unit)
    else:
        raise ValueError(f"Unrecognized length unit: {unit!r}")


class ValidationIssue(NamedTuple):
    field: str
    severity: str  # "ERROR" or "WARNING"
    message: str


def validate_building_info_sanity(info: BuildingInfo) -> list[ValidationIssue]:
    """Run non-destructive sanity and consistency checks on extracted BuildingInfo.

    Returns a list of warnings or errors found. Does not mutate the model.
    """
    issues: list[ValidationIssue] = []

    # 1. Non-negative checks
    numeric_fields = [
        ("plot_area_sqm", info.plot_area_sqm.value),
        ("total_builtup_area_sqm", info.total_builtup_area_sqm.value),
        ("ground_coverage_sqm", info.ground_coverage_sqm.value),
        ("building_height_m", info.building_height_m.value),
        ("road_width_m", info.road_width_m.value),
        ("parking_spaces_provided", info.parking_spaces_provided.value),
        ("setbacks.front_m", info.setbacks.front_m.value),
        ("setbacks.rear_m", info.setbacks.rear_m.value),
        ("setbacks.side1_m", info.setbacks.side1_m.value),
        ("setbacks.side2_m", info.setbacks.side2_m.value),
        ("fire_safety.staircase_width_m", info.fire_safety.staircase_width_m.value),
    ]

    for name, val in numeric_fields:
        if val is not None and val < 0:
            issues.append(
                ValidationIssue(
                    field=name,
                    severity="ERROR",
                    message=f"Negative value ({val}) is physically invalid.",
                )
            )

    # 2. Ground coverage cannot exceed plot area
    if (
        info.ground_coverage_sqm.value is not None
        and info.plot_area_sqm.value is not None
        and info.plot_area_sqm.value > 0
    ):
        if info.ground_coverage_sqm.value > info.plot_area_sqm.value:
            issues.append(
                ValidationIssue(
                    field="ground_coverage_sqm",
                    severity="ERROR",
                    message=(
                        f"Ground coverage ({info.ground_coverage_sqm.value} sq.m) "
                        f"cannot exceed plot area ({info.plot_area_sqm.value} sq.m)."
                    ),
                )
            )

    # 3. Height vs. floor count consistency check
    if (
        info.building_height_m.value is not None
        and info.number_of_floors.value is not None
        and info.number_of_floors.value > 0
    ):
        height_per_floor = info.building_height_m.value / info.number_of_floors.value
        # Typical floor heights in Delhi are between 2.6m and 4.5m
        if height_per_floor < 2.0 or height_per_floor > 6.0:
            issues.append(
                ValidationIssue(
                    field="building_height_m",
                    severity="WARNING",
                    message=(
                        f"Average floor height is {height_per_floor:.2f} m "
                        f"({info.building_height_m.value} m across {info.number_of_floors.value} floors), "
                        "which is outside typical residential/commercial norms (2.0m - 6.0m per floor)."
                    ),
                )
            )

    return issues
