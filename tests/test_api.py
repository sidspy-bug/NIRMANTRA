"""
Tests for FastAPI REST API endpoints.
"""

from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from nirmantra_ai.api.app import create_app
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.pipeline import CompliancePipeline


@pytest.fixture
def test_client() -> TestClient:
    """Fixture providing a TestClient connected to an app with MockLLMClient."""
    pipeline = CompliancePipeline(
        llm_client=MockLLMClient(),
        seed_knowledge_base=True,
    )
    app = create_app(pipeline=pipeline)
    return TestClient(app)


def test_api_health_check(test_client: TestClient) -> None:
    """Test /health endpoint."""
    response = test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "Nirmaantra AI"
    assert data["jurisdiction"] == "Delhi NCT, India"
    assert data["rules_loaded"] > 0
    assert data["regulations_loaded"] > 0


def test_api_list_rules(test_client: TestClient) -> None:
    """Test /api/v1/rules endpoint."""
    response = test_client.get("/api/v1/rules")
    assert response.status_code == 200
    data = response.json()
    assert data["jurisdiction"] == "Delhi NCT, India"
    assert data["total_rules"] >= 7
    assert len(data["rules"]) == data["total_rules"]
    # Check that each rule contains statutory citation
    for rule in data["rules"]:
        assert "rule_id" in rule
        assert "citation" in rule
        assert "Unified Building Bye-Laws" in rule["citation"] or "Delhi Fire Service" in rule["citation"]


def test_api_analyze_text_success(test_client: TestClient) -> None:
    """Test /api/v1/analyze-text endpoint."""
    payload = {
        "text": (
            "Project Name: Rohini Residency\n"
            "Plot Area: 450 sq.m\n"
            "Total Built-up Area: 1100 sq.m\n"
            "Height: 14.5 m\n"
            "Front Setback: 6.2 m\n"
            "Rear Setback: 3.5 m\n"
        ),
        "project_name": "Rohini Residency",
    }
    response = test_client.post("/api/v1/analyze-text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "Rohini Residency"
    assert data["jurisdiction"] == "Delhi NCT, India"
    assert "summary" in data
    assert "findings" in data
    assert len(data["findings"]) > 0
    assert "disclaimer" in data
    assert "Council of Architecture (COA)" in data["disclaimer"]


def test_api_analyze_text_too_short(test_client: TestClient) -> None:
    """Test /api/v1/analyze-text rejects inputs shorter than 10 chars."""
    response = test_client.post("/api/v1/analyze-text", json={"text": "short"})
    assert response.status_code == 422


def test_api_analyze_file_pdf(test_client: TestClient, tmp_text_pdf: Path) -> None:
    """Test /api/v1/analyze-file with multipart PDF upload."""
    with open(tmp_text_pdf, "rb") as f:
        response = test_client.post(
            "/api/v1/analyze-file",
            files={"file": (tmp_text_pdf.name, f, "application/pdf")},
            data={"project_name": "Uploaded Demo Project"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "Uploaded Demo Project"
    assert data["source_document"] == tmp_text_pdf.name
    assert "summary" in data
    assert len(data["findings"]) > 0


def test_api_analyze_file_unsupported_type(test_client: TestClient, tmp_path: Path) -> None:
    """Test /api/v1/analyze-file rejects unsupported file formats."""
    dummy_file = tmp_path / "notes.txt"
    dummy_file.write_text("plot: 500 sqm")

    with open(dummy_file, "rb") as f:
        response = test_client.post(
            "/api/v1/analyze-file",
            files={"file": ("notes.txt", f, "text/plain")},
        )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_api_analyze_parameters_direct(test_client: TestClient) -> None:
    """Test /api/v1/analyze-parameters endpoint for direct form evaluation."""
    payload = {
        "project_name": {"value": "Param Test Complex", "provenance": {"raw_text": "Param Test"}},
        "plot_area_sqm": {"value": 500.0, "provenance": {"raw_text": "500"}},
        "total_builtup_area_sqm": {"value": 1100.0, "provenance": {"raw_text": "1100"}},
        "ground_coverage_sqm": {"value": 320.0, "provenance": {"raw_text": "320"}},
        "building_height_m": {"value": 14.8, "provenance": {"raw_text": "14.8"}},
        "setbacks": {
            "front_m": {"value": 6.5, "provenance": {"raw_text": "6.5"}},
            "rear_m": {"value": 3.2, "provenance": {"raw_text": "3.2"}},
        },
    }
    response = test_client.post("/api/v1/analyze-parameters", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "Param Test Complex"
    assert data["summary"]["total_requirements_checked"] > 0
    assert data["summary"]["passed_count"] > 0
