"""
Building Information Extraction module.

Converts unstructured document text into strongly-typed BuildingInfo objects
with provenance, confidence tracking, and unit validation.
"""

from nirmantra_ai.extraction.client import (
    LLMClient,
    MockLLMClient,
    OpenAILLMClient,
)
from nirmantra_ai.extraction.extractor import BuildingInfoExtractor
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    FireSafetyData,
    OccupancyType,
    SetbackData,
)
from nirmantra_ai.extraction.validators import (
    convert_area_to_sqm,
    convert_length_to_metres,
    validate_building_info_sanity,
)

__all__ = [
    "BuildingInfo",
    "BuildingInfoExtractor",
    "FieldProvenance",
    "FireSafetyData",
    "LLMClient",
    "MockLLMClient",
    "OccupancyType",
    "OpenAILLMClient",
    "SetbackData",
    "convert_area_to_sqm",
    "convert_length_to_metres",
    "validate_building_info_sanity",
]
