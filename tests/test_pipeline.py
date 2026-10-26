"""
Tests for CompliancePipeline master orchestrator.
"""

from pathlib import Path
import pytest

from nirmantra_ai.compliance.models import RuleStatus
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.extraction.models import BuildingInfo, FieldProvenance
from nirmantra_ai.pipeline import CompliancePipeline
from nirmantra_ai.reporting.models import OverallComplianceStatus


@pytest.fixture
def mock_pipeline() -> CompliancePipeline:
    """Fixture providing a CompliancePipeline configured with MockLLMClient."""
    return CompliancePipeline(
        llm_client=MockLLMClient(),
        seed_knowledge_base=True,
    )


def test_pipeline_initialization(mock_pipeline: CompliancePipeline) -> None:
    """Test that pipeline initializes with all internal components active."""
    assert mock_pipeline.compliance_engine is not None
    assert len(mock_pipeline.compliance_engine.rules) > 0
    assert mock_pipeline.store.count() > 0
    assert mock_pipeline.retriever is not None
    assert mock_pipeline.report_builder is not None


def test_pipeline_analyze_text(mock_pipeline: CompliancePipeline) -> None:
    """Test full text analysis flow through pipeline."""
    sample_text = (
        "Project Name: Greenfield Residency\n"
        "Plot Area: 450 sq.m\n"
        "Total Built-up Area: 1100 sq.m\n"
        "Building Height: 14.5 m\n"
        "Front Setback: 6.5 m\n"
        "Rear Setback: 3.5 m\n"
    )

    report = mock_pipeline.analyze_text(
        text=sample_text,
        project_name="Greenfield Residency",
    )

    assert report.report_id is not None
    assert report.project_name == "Greenfield Residency"
    assert report.jurisdiction == "Delhi NCT, India"
    assert len(report.findings) > 0
    assert report.summary.total_requirements_checked > 0
    assert report.disclaimer is not None
    assert "Council of Architecture (COA)" in report.disclaimer


def test_pipeline_analyze_empty_text_raises(mock_pipeline: CompliancePipeline) -> None:
    """Test that empty or whitespace-only text raises ValueError."""
    with pytest.raises(ValueError, match="Input text cannot be empty"):
        mock_pipeline.analyze_text("   \n   ")


def test_pipeline_analyze_building_info_direct(mock_pipeline: CompliancePipeline) -> None:
    """Test direct evaluation of pre-constructed BuildingInfo."""
    info = BuildingInfo(
        project_name=FieldProvenance.explicit("Direct Test Tower"),
        plot_area_sqm=FieldProvenance.explicit(500.0),
        total_builtup_area_sqm=FieldProvenance.explicit(1000.0),
        ground_coverage_sqm=FieldProvenance.explicit(300.0),
        building_height_m=FieldProvenance.explicit(14.0),
    )
    info.setbacks.front_m = FieldProvenance.explicit(6.5)
    info.setbacks.rear_m = FieldProvenance.explicit(3.5)

    report = mock_pipeline.analyze_building_info(info)

    assert report.project_name == "Direct Test Tower"
    assert report.summary.passed_count > 0
    assert report.summary.overall_status in (
        OverallComplianceStatus.COMPLIANT,
        OverallComplianceStatus.REQUIRES_REVIEW,
        OverallComplianceStatus.NON_COMPLIANT,
    )


def test_pipeline_analyze_file_synthetic_pdf(
    mock_pipeline: CompliancePipeline,
    tmp_text_pdf: Path,
) -> None:
    """Test analysis of a sample PDF file using MockLLMClient."""
    report = mock_pipeline.analyze_file(tmp_text_pdf)

    assert report.report_id is not None
    assert report.findings
    assert report.source_document is not None


def test_pipeline_analyze_file_nonexistent_raises(mock_pipeline: CompliancePipeline) -> None:
    """Test that missing file raises FileNotFoundError."""
    with pytest.raises(FileNotFoundError, match="Document file not found"):
        mock_pipeline.analyze_file("nonexistent_building_plan.pdf")


def test_pipeline_analyze_file_unsupported_extension_raises(
    mock_pipeline: CompliancePipeline,
    tmp_path: Path,
) -> None:
    """Test that unsupported file format raises ValueError."""
    dummy_file = tmp_path / "plan.docx"
    dummy_file.write_text("dummy content")

    with pytest.raises(ValueError, match="Unsupported document format"):
        mock_pipeline.analyze_file(dummy_file)
