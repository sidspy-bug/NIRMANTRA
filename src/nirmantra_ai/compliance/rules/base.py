"""
Base class for deterministic statutory compliance rules.

Every rule evaluates building characteristics strictly via Python code
without non-deterministic LLM intervention.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from nirmantra_ai.compliance.models import RuleResult
from nirmantra_ai.extraction.models import BuildingInfo
from nirmantra_ai.knowledge.models import RegulatoryCategory


class ComplianceRule(ABC):
    """Abstract interface for all statutory compliance check implementations."""

    rule_id: str
    rule_name: str
    category: RegulatoryCategory
    source_citation: str
    rule_version: str = "UBBL-2016-v1"

    @abstractmethod
    def evaluate(self, info: BuildingInfo) -> RuleResult:
        """Evaluate the rule against the extracted BuildingInfo.

        Must return a RuleResult with status PASS, FAIL, NEEDS_REVIEW,
        or NOT_APPLICABLE.
        """
        ...
