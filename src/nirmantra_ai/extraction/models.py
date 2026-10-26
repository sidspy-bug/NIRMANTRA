"""
Data models for structured building information extraction.

Every extracted parameter retains provenance metadata (source page,
raw snippet, confidence, and whether it was explicitly stated or inferred).
Missing values remain None and must never be fabricated.
"""

from __future__ import annotations

from enum import Enum
from typing import Generic, TypeVar

from pydantic import BaseModel, Field, model_validator

from nirmantra_ai.document.models import Confidence

T = TypeVar("T")


class OccupancyType(str, Enum):
    """Building occupancy classification under Delhi Unified Building Bye-Laws."""

    # Core Focal Occupancies
    EDUCATIONAL = "educational"
    HOSPITAL = "hospital"
    HOTEL = "hotel"
    SHOPPING_CENTER = "shopping_center"

    # General & Legacy Occupancies
    COMMERCIAL = "commercial"
    INSTITUTIONAL = "institutional"
    RESIDENTIAL = "residential"
    INDUSTRIAL = "industrial"
    ASSEMBLY = "assembly"
    HAZARDOUS = "hazardous"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class FieldProvenance(BaseModel, Generic[T]):
    """Wraps an extracted value with its audit trail and confidence."""

    value: T | None = Field(
        default=None,
        description="The extracted value, or None if not found in the document.",
    )
    raw_snippet: str | None = Field(
        default=None,
        description="Exact text fragment from the document from which this value was extracted.",
    )
    page_number: int | None = Field(
        default=None,
        ge=1,
        description="1-indexed document page number where the evidence appears.",
    )
    confidence: Confidence = Field(
        default=Confidence.UNKNOWN,
        description="Confidence assessment of the extraction.",
    )
    is_inferred: bool = Field(
        default=False,
        description="True if value was inferred/calculated; False if explicitly stated in text.",
    )

    @classmethod
    def explicit(
        cls,
        value: T,
        raw_snippet: str | None = None,
        page_number: int | None = None,
        confidence: Confidence = Confidence.HIGH,
    ) -> FieldProvenance[T]:
        """Factory for explicitly stated facts."""
        return cls(
            value=value,
            raw_snippet=raw_snippet,
            page_number=page_number,
            confidence=confidence,
            is_inferred=False,
        )

    @classmethod
    def inferred(
        cls,
        value: T,
        raw_snippet: str | None = None,
        page_number: int | None = None,
        confidence: Confidence = Confidence.MEDIUM,
    ) -> FieldProvenance[T]:
        """Factory for values deduced or calculated from context."""
        return cls(
            value=value,
            raw_snippet=raw_snippet,
            page_number=page_number,
            confidence=confidence,
            is_inferred=True,
        )

    @classmethod
    def missing(cls) -> FieldProvenance[T]:
        """Factory for missing data."""
        return cls(value=None, confidence=Confidence.UNKNOWN, is_inferred=False)


class SetbackData(BaseModel):
    """Setback distances measured in metres."""

    front_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    rear_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    side1_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    side2_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)


class FireSafetyData(BaseModel):
    """Fire and life safety provisions recorded from the document."""

    staircase_width_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    fire_extinguishers_present: FieldProvenance[bool] = Field(
        default_factory=FieldProvenance.missing
    )
    fire_alarm_present: FieldProvenance[bool] = Field(default_factory=FieldProvenance.missing)
    sprinklers_present: FieldProvenance[bool] = Field(default_factory=FieldProvenance.missing)
    emergency_exits_count: FieldProvenance[int] = Field(default_factory=FieldProvenance.missing)
    refuge_area_present: FieldProvenance[bool] = Field(default_factory=FieldProvenance.missing)
    corridor_width_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    ramp_provided: FieldProvenance[bool] = Field(default_factory=FieldProvenance.missing)
    number_of_staircases: FieldProvenance[int] = Field(default_factory=FieldProvenance.missing)
    travel_distance_to_exit_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)


class BuildingInfo(BaseModel):
    """Normalized structured building representation extracted from documents.

    All physical measurements are normalized to metric units:
    - Areas in square metres (sq. m)
    - Lengths/heights in metres (m)
    """

    project_name: FieldProvenance[str] = Field(default_factory=FieldProvenance.missing)
    location_address: FieldProvenance[str] = Field(default_factory=FieldProvenance.missing)
    occupancy_type: FieldProvenance[OccupancyType] = Field(
        default_factory=FieldProvenance.missing
    )
    plot_area_sqm: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    total_builtup_area_sqm: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    ground_coverage_sqm: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    building_height_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    number_of_floors: FieldProvenance[int] = Field(default_factory=FieldProvenance.missing)
    road_width_m: FieldProvenance[float] = Field(default_factory=FieldProvenance.missing)
    parking_spaces_provided: FieldProvenance[int] = Field(default_factory=FieldProvenance.missing)

    setbacks: SetbackData = Field(default_factory=SetbackData)
    fire_safety: FireSafetyData = Field(default_factory=FireSafetyData)

    # Extraction audit metadata
    source_filename: str | None = None
    extraction_warnings: list[str] = Field(default_factory=list)

    @property
    def has_critical_dimensions(self) -> bool:
        """True if core parameters required for basic zoning/FAR evaluation are present."""
        return (
            self.plot_area_sqm.value is not None
            and self.total_builtup_area_sqm.value is not None
        )

    @classmethod
    def _wrap_field(cls, val: Any) -> dict[str, Any]:
        """Wrap a scalar value, dict, or FieldProvenance into a FieldProvenance dict."""
        if isinstance(val, FieldProvenance):
            return {
                "value": val.value,
                "raw_snippet": val.raw_snippet,
                "page_number": val.page_number,
                "confidence": val.confidence.value if hasattr(val.confidence, "value") else val.confidence,
                "is_inferred": val.is_inferred,
            }
        if isinstance(val, dict) and "value" in val:
            return val
        return {
            "value": val,
            "raw_snippet": str(val) if val is not None else None,
            "confidence": "high" if val is not None else "unknown",
            "is_inferred": False,
        }

    @model_validator(mode="before")
    @classmethod
    def _normalize_llm_json(cls, data: Any) -> Any:
        """Coerce both flat, nested, and enveloped JSON outputs into canonical BuildingInfo structure."""
        if not isinstance(data, dict):
            return data

        # Unwrap any outer envelopes like {"building_information": {...}}
        for envelope in ("building_information", "building_info", "data", "extracted_info"):
            if envelope in data and isinstance(data[envelope], dict):
                data = {**data, **data[envelope]}

        # Unwrap nested sub-dicts like {"dimensions": {...}}
        if "dimensions" in data and isinstance(data["dimensions"], dict):
            data = {**data, **data["dimensions"]}

        normalized: dict[str, Any] = {}

        # 1. Direct fields
        direct_map = {
            "project_name": "project_name",
            "building_name": "project_name",
            "location_address": "location_address",
            "location": "location_address",
            "address": "location_address",
            "occupancy_type": "occupancy_type",
            "occupancy_classification": "occupancy_type",
            "plot_area": "plot_area_sqm",
            "plot_area_sqm": "plot_area_sqm",
            "total_builtup_area_sqm": "total_builtup_area_sqm",
            "total_built_up_area": "total_builtup_area_sqm",
            "total_built_up_area_sqm": "total_builtup_area_sqm",
            "ground_coverage_sqm": "ground_coverage_sqm",
            "ground_floor_plinth_coverage": "ground_coverage_sqm",
            "ground_floor_plinth_coverage_sqm": "ground_coverage_sqm",
            "building_height_m": "building_height_m",
            "proposed_building_height": "building_height_m",
            "proposed_building_height_m": "building_height_m",
            "number_of_floors": "number_of_floors",
            "road_width_m": "road_width_m",
            "front_road_width": "road_width_m",
            "front_road_width_m": "road_width_m",
            "parking_spaces_provided": "parking_spaces_provided",
        }

        for src_k, target_k in direct_map.items():
            if src_k in data and target_k not in normalized:
                normalized[target_k] = cls._wrap_field(data[src_k])

        # Normalize occupancy type string to enum if present
        if "occupancy_type" in normalized:
            occ_val = normalized["occupancy_type"].get("value")
            if isinstance(occ_val, str):
                v_low = occ_val.lower()
                if any(k in v_low for k in ("school", "college", "university", "academic", "education")):
                    normalized["occupancy_type"]["value"] = OccupancyType.EDUCATIONAL
                elif any(k in v_low for k in ("hospital", "clinic", "nursing", "health", "medical")):
                    normalized["occupancy_type"]["value"] = OccupancyType.HOSPITAL
                elif any(k in v_low for k in ("hotel", "motel", "resort", "guest house")):
                    normalized["occupancy_type"]["value"] = OccupancyType.HOTEL
                elif any(k in v_low for k in ("mall", "shopping", "retail", "mercantile")):
                    normalized["occupancy_type"]["value"] = OccupancyType.SHOPPING_CENTER
                elif "residen" in v_low:
                    normalized["occupancy_type"]["value"] = OccupancyType.RESIDENTIAL
                elif "commercial" in v_low:
                    normalized["occupancy_type"]["value"] = OccupancyType.COMMERCIAL
                elif "institution" in v_low:
                    normalized["occupancy_type"]["value"] = OccupancyType.INSTITUTIONAL

        # 2. Setbacks
        raw_setbacks = data.get("setbacks")
        if isinstance(raw_setbacks, SetbackData):
            setbacks = {
                "front_m": raw_setbacks.front_m,
                "rear_m": raw_setbacks.rear_m,
                "side1_m": raw_setbacks.side1_m,
                "side2_m": raw_setbacks.side2_m,
            }
        elif isinstance(raw_setbacks, dict):
            setbacks = raw_setbacks
        else:
            setbacks = {}

        front = setbacks.get("front_m", setbacks.get("front_setback", data.get("front_setback_m", data.get("front_setback"))))
        rear = setbacks.get("rear_m", setbacks.get("rear_setback", data.get("rear_setback_m", data.get("rear_setback"))))
        side1 = setbacks.get("side1_m", setbacks.get("side_setback_1", data.get("side_setback_left_m", data.get("side_setback_1_m"))))
        side2 = setbacks.get("side2_m", setbacks.get("side_setback_2", data.get("side_setback_right_m", data.get("side_setback_2_m"))))

        normalized["setbacks"] = {
            "front_m": cls._wrap_field(front),
            "rear_m": cls._wrap_field(rear),
            "side1_m": cls._wrap_field(side1),
            "side2_m": cls._wrap_field(side2),
        }

        # 3. Fire Safety
        raw_fire = (
            data.get("fire_safety_provisions")
            or data.get("fire_safety")
        )
        if isinstance(raw_fire, FireSafetyData):
            fire = {
                "staircase_width_m": raw_fire.staircase_width_m,
                "fire_extinguishers_present": raw_fire.fire_extinguishers_present,
                "fire_alarm_present": raw_fire.fire_alarm_present,
                "sprinklers_present": raw_fire.sprinklers_present,
                "emergency_exits_count": raw_fire.emergency_exits_count,
                "refuge_area_present": raw_fire.refuge_area_present,
                "corridor_width_m": raw_fire.corridor_width_m,
                "ramp_provided": raw_fire.ramp_provided,
                "number_of_staircases": raw_fire.number_of_staircases,
                "travel_distance_to_exit_m": raw_fire.travel_distance_to_exit_m,
            }
        elif isinstance(raw_fire, dict):
            fire = raw_fire
        else:
            fire = {}

        staircase = fire.get(
            "staircase_width_m",
            fire.get("primary_emergency_staircase_width", data.get("primary_emergency_staircase_width_m")),
        )
        extinguishers_raw = fire.get(
            "fire_extinguishers_present",
            fire.get("portable_fire_extinguishers", data.get("portable_fire_extinguishers_provided")),
        )
        alarm_raw = fire.get(
            "fire_alarm_present",
            fire.get("automatic_smoke_detection_system", data.get("automatic_smoke_detection_system_installed")),
        )
        sprinklers_raw = fire.get("sprinklers_present", data.get("sprinklers_present"))
        exits_raw = fire.get("emergency_exits_count", data.get("emergency_exits_count"))
        refuge_raw = fire.get(
            "refuge_area_present",
            fire.get("refuge_area", data.get("refuge_area_provided")),
        )
        corridor_raw = fire.get("corridor_width_m", data.get("corridor_width_m", data.get("corridor_width")))
        ramp_raw = fire.get("ramp_provided", data.get("ramp_provided", data.get("evacuation_ramp")))
        staircases_count_raw = fire.get("number_of_staircases", data.get("number_of_staircases", data.get("staircase_count")))
        travel_dist_raw = fire.get("travel_distance_to_exit_m", data.get("travel_distance_to_exit_m", data.get("travel_distance")))

        def _to_bool_field(val: Any) -> Any:
            wrapped = cls._wrap_field(val)
            v = wrapped.get("value")
            if isinstance(v, str):
                v_lower = v.lower()
                if any(w in v_lower for w in ("provided", "installed", "yes", "true", "present")):
                    wrapped["value"] = True
                elif any(w in v_lower for w in ("none", "not provided", "false", "no")):
                    wrapped["value"] = False
            return wrapped

        normalized["fire_safety"] = {
            "staircase_width_m": cls._wrap_field(staircase),
            "fire_extinguishers_present": _to_bool_field(extinguishers_raw),
            "fire_alarm_present": _to_bool_field(alarm_raw),
            "sprinklers_present": _to_bool_field(sprinklers_raw),
            "emergency_exits_count": cls._wrap_field(exits_raw),
            "refuge_area_present": _to_bool_field(refuge_raw),
            "corridor_width_m": cls._wrap_field(corridor_raw),
            "ramp_provided": _to_bool_field(ramp_raw),
            "number_of_staircases": cls._wrap_field(staircases_count_raw),
            "travel_distance_to_exit_m": cls._wrap_field(travel_dist_raw),
        }

        if "source_filename" in data:
            normalized["source_filename"] = data["source_filename"]
        if "extraction_warnings" in data:
            normalized["extraction_warnings"] = data["extraction_warnings"]

        return normalized
