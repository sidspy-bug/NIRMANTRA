"""
Nirmantra AI — Building safety and regulatory compliance analysis engine.

Delhi NCT, India.
"""

__version__ = "0.1.0"

from nirmantra_ai.pipeline import CompliancePipeline
from nirmantra_ai.reporting.models import ComplianceReport

__all__ = ["CompliancePipeline", "ComplianceReport", "__version__"]
