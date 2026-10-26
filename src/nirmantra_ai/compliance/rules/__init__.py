"""Statutory compliance rules sub-package."""

from nirmantra_ai.compliance.rules.base import ComplianceRule
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

__all__ = [
    "CommercialParkingRule",
    "ComplianceRule",
    "FireDetectionEquipmentRule",
    "FireServiceClearanceRule",
    "FloorAreaRatioRule",
    "FrontSetbackRule",
    "GroundCoverageRule",
    "HospitalSafetyRule",
    "RearSetbackRule",
    "ShoppingCenterExitRule",
    "SideSetbackRule",
    "StaircaseWidthRule",
]
