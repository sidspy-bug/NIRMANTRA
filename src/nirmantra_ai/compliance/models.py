"""
Data models for the deterministic compliance rule engine.

Defines standardized rule statuses, measurement evaluations,
and audit trails for building regulations.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from nirmantra_ai.knowledge.models import RegulatoryCategory


class RuleStatus(str, Enum):
    """The four official evaluation outcomes of a compliance rule."""

    PASS = "PASS"                     # Confirmed compliant with statutory limits
    FAIL = "FAIL"                     # Confirmed violation of statutory limits
    NEEDS_REVIEW = "NEEDS_REVIEW"     # Critical evidence missing or borderline
    NOT_APPLICABLE = "NOT_APPLICABLE" # Rule does not apply to this occupancy/plot type


class RuleResult(BaseModel):
    """Evaluation result for an individual statutory compliance requirement."""

    rule_id: str = Field(
        description="Unique identifier for the rule (e.g., 'DELHI_UBBL_2016_SETBACK_FRONT').",
    )
    rule_name: str = Field(
        description="Human-readable title of the requirement.",
    )
    category: RegulatoryCategory = Field(
        description="Compliance topic (e.g., SETBACK, FAR, FIRE_SAFETY).",
    )
    status: RuleStatus = Field(
        description="Outcome of the deterministic evaluation.",
    )
    measured_value: Any | None = Field(
        default=None,
        description="Observed or calculated value from the building documentation.",
    )
    permissible_limit: Any | None = Field(
        default=None,
        description="Statutory limit (e.g., minimum required or maximum allowed).",
    )
    unit: str | None = Field(
        default=None,
        description="Measurement unit (e.g., 'm', 'sq.m', '%').",
    )
    details: str = Field(
        description="Detailed explanation of how the status was determined.",
    )
    source_citation: str = Field(
        description="Exact legal provision and authority reference (e.g., 'UBBL 2016 Clause 7.14.1').",
    )
    rule_version: str = Field(
        default="UBBL-2016-v1",
        description="Version identifier of the encoded rule logic.",
    )
    requires_human_review: bool = Field(
        default=False,
        description="True if an engineer/architect must manually inspect the physical plan.",
    )
    missing_evidence_fields: list[str] = Field(
        default_factory=list,
        description="List of fields that were missing from the document, preventing a conclusive determination.",
    )

    @property
    def is_conclusive(self) -> bool:
        """True if the rule reached a conclusive PASS or FAIL determination."""
        return self.status in {RuleStatus.PASS, RuleStatus.FAIL}


class ComplianceEvaluationSummary(BaseModel):
    """Aggregated summary of compliance engine results."""

    total_rules_evaluated: int = 0
    passed_count: int = 0
    failed_count: int = 0
    needs_review_count: int = 0
    not_applicable_count: int = 0
    results: list[RuleResult] = Field(default_factory=list)

    @classmethod
    def from_results(cls, results: list[RuleResult]) -> ComplianceEvaluationSummary:
        return cls(
            total_rules_evaluated=len(results),
            passed_count=sum(1 for r in results if r.status == RuleStatus.PASS),
            failed_count=sum(1 for r in results if r.status == RuleStatus.FAIL),
            needs_review_count=sum(1 for r in results if r.status == RuleStatus.NEEDS_REVIEW),
            not_applicable_count=sum(1 for r in results if r.status == RuleStatus.NOT_APPLICABLE),
            results=results,
        )
