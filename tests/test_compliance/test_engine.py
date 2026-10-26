"""
Unit tests for ComplianceEngine orchestrator.
"""

from __future__ import annotations

from nirmantra_ai.compliance.engine import ComplianceEngine
from nirmantra_ai.compliance.models import RuleStatus
from nirmantra_ai.extraction.models import (
    BuildingInfo,
    FieldProvenance,
    FireSafetyData,
    OccupancyType,
    SetbackData,
)
from nirmantra_ai.knowledge.models import RegulatoryCategory


def test_engine_evaluates_fully_compliant_building() -> None:
    engine = ComplianceEngine()

    compliant_building = BuildingInfo(
        project_name=FieldProvenance.explicit("Model Residential Villa"),
        occupancy_type=FieldProvenance.explicit(OccupancyType.RESIDENTIAL),
        plot_area_sqm=FieldProvenance.explicit(400.0),
        total_builtup_area_sqm=FieldProvenance.explicit(600.0),  # FAR = 150 <= 225 (PASS)
        ground_coverage_sqm=FieldProvenance.explicit(200.0),      # Coverage = 50% <= 75% (PASS)
        building_height_m=FieldProvenance.explicit(12.0),         # <= 15m (DFS PASS)
        setbacks=SetbackData(
            front_m=FieldProvenance.explicit(6.5),                # >= 6.0m (PASS)
            rear_m=FieldProvenance.explicit(3.5),                 # >= 3.0m (PASS)
        ),
        fire_safety=FireSafetyData(
            staircase_width_m=FieldProvenance.explicit(1.2),      # >= 1.0m (PASS)
        ),
    )

    summary = engine.evaluate(compliant_building)

    assert summary.total_rules_evaluated >= 6
    assert summary.failed_count == 0
    assert summary.passed_count >= 5


def test_engine_category_filtering() -> None:
    engine = ComplianceEngine()

    info = BuildingInfo(
        plot_area_sqm=FieldProvenance.explicit(300.0),
        setbacks=SetbackData(front_m=FieldProvenance.explicit(7.0)),
    )

    # Filter to SETBACK rules only
    summary = engine.evaluate(info, categories=[RegulatoryCategory.SETBACK])

    assert summary.total_rules_evaluated == 2  # Front & Rear setback
    for res in summary.results:
        assert res.category == RegulatoryCategory.SETBACK


def test_engine_registers_custom_rule() -> None:
    from nirmantra_ai.compliance.models import RuleResult
    from nirmantra_ai.compliance.rules.base import ComplianceRule

    class DummyParkingRule(ComplianceRule):
        rule_id = "TEST_PARKING"
        rule_name = "Test Parking Rule"
        category = RegulatoryCategory.PARKING
        source_citation = "Custom Citation"

        def evaluate(self, info: BuildingInfo) -> RuleResult:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                category=self.category,
                status=RuleStatus.PASS,
                details="Always passes",
                source_citation=self.source_citation,
            )

    engine = ComplianceEngine()
    initial_count = len(engine.registered_rules)
    engine.register_rule(DummyParkingRule())

    assert len(engine.registered_rules) == initial_count + 1
    summary = engine.evaluate(BuildingInfo(), categories=[RegulatoryCategory.PARKING])
    assert summary.passed_count == 1
    assert summary.results[0].rule_id == "TEST_PARKING"
