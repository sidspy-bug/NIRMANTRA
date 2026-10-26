"""
Unit tests for publication-quality PDF audit certificate generator.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from nirmantra_ai.api.app import create_app
from nirmantra_ai.compliance.engine import ComplianceEngine
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.extraction.models import BuildingInfo, FieldProvenance
from nirmantra_ai.pipeline import CompliancePipeline
from nirmantra_ai.reporting.models import ComplianceReport
from nirmantra_ai.reporting.pdf_generator import PdfReportGenerator, generate_compliance_pdf
from nirmantra_ai.reporting.report_builder import ReportBuilder


@pytest.fixture
def sample_report() -> ComplianceReport:
    """Fixture providing a populated ComplianceReport for testing."""
    engine = ComplianceEngine()
    info = BuildingInfo(
        project_name=FieldProvenance.explicit("Vasant Kunj Heights"),
        location_address=FieldProvenance.explicit("Pocket 4, Sector B, Vasant Kunj, New Delhi"),
        plot_area_sqm=FieldProvenance.explicit(450.0),
        total_builtup_area_sqm=FieldProvenance.explicit(1150.0),
        ground_coverage_sqm=FieldProvenance.explicit(310.0),
        building_height_m=FieldProvenance.explicit(16.2),
    )
    info.setbacks.front_m = FieldProvenance.explicit(5.2)
    info.setbacks.rear_m = FieldProvenance.explicit(3.5)
    info.fire_safety.staircase_width_m = FieldProvenance.explicit(1.35)
    info.fire_safety.fire_extinguishers_present = FieldProvenance.explicit(True)
    info.fire_safety.fire_alarm_present = FieldProvenance.explicit(True)

    summary = engine.evaluate(info)
    builder = ReportBuilder()
    return builder.build_report(info, summary)


def test_generate_pdf_bytes_in_memory(sample_report: ComplianceReport) -> None:
    """Test generating in-memory PDF bytes."""
    generator = PdfReportGenerator()
    pdf_bytes = generator.generate(sample_report)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    # PDF magic bytes
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_to_file(sample_report: ComplianceReport, tmp_path: Path) -> None:
    """Test generating PDF directly to a file on disk."""
    out_file = tmp_path / "vasant_kunj_audit.pdf"
    result_path = generate_compliance_pdf(sample_report, output_path=out_file)

    assert result_path == out_file
    assert out_file.is_file()
    assert out_file.stat().st_size > 2000

    content = out_file.read_bytes()
    assert content.startswith(b"%PDF-")


def test_pipeline_generate_pdf_report(sample_report: ComplianceReport, tmp_path: Path) -> None:
    """Test pipeline.generate_pdf_report method."""
    pipeline = CompliancePipeline(llm_client=MockLLMClient(), seed_knowledge_base=False)
    out_file = tmp_path / "pipeline_report.pdf"
    res = pipeline.generate_pdf_report(sample_report, output_path=out_file)

    assert res == out_file
    assert out_file.is_file()
    assert out_file.stat().st_size > 2000


def test_api_export_report_pdf_endpoint(sample_report: ComplianceReport) -> None:
    """Test /api/v1/report/pdf endpoint returns application/pdf."""
    pipeline = CompliancePipeline(llm_client=MockLLMClient(), seed_knowledge_base=False)
    app = create_app(pipeline=pipeline)
    client = TestClient(app)

    response = client.post("/api/v1/report/pdf", json=sample_report.model_dump(mode="json"))
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF-")


def test_api_analyze_file_and_download_pdf_endpoint(tmp_text_pdf: Path) -> None:
    """Test /api/v1/analyze-file/pdf endpoint uploads drawing and returns PDF certificate."""
    pipeline = CompliancePipeline(llm_client=MockLLMClient(), seed_knowledge_base=True)
    app = create_app(pipeline=pipeline)
    client = TestClient(app)

    with open(tmp_text_pdf, "rb") as f:
        response = client.post(
            "/api/v1/analyze-file/pdf",
            files={"file": (tmp_text_pdf.name, f, "application/pdf")},
            data={"project_name": "Downloaded Certificate Test"},
        )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 3000
