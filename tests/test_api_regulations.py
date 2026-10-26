"""
Tests for regulation upload and listing API endpoints.
"""

from __future__ import annotations

import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from nirmantra_ai.api.app import create_app
from nirmantra_ai.extraction.client import MockLLMClient
from nirmantra_ai.pipeline import CompliancePipeline


@pytest.fixture
def test_client() -> TestClient:
    pipeline = CompliancePipeline(
        llm_client=MockLLMClient(),
        seed_knowledge_base=True,
    )
    app = create_app(pipeline=pipeline)
    return TestClient(app)


def test_api_list_regulations(test_client: TestClient) -> None:
    response = test_client.get("/api/v1/regulations")
    assert response.status_code == 200
    data = response.json()
    assert data["jurisdiction"] == "Delhi NCT, India"
    assert data["total_chunks"] > 0
    assert "categories" in data
    assert "sample_provisions" in data


def test_api_upload_regulations_json(test_client: TestClient, tmp_path: Path) -> None:
    ubbl_data = {
        "document_title": "UBBL 2016 Amendment",
        "authority": "Delhi Development Authority",
        "provisions": [
            {
                "clause": "Rule 12.1",
                "content": "Solar rooftop panel installation is mandatory for plots over 500 sqm.",
                "category": "green_building",
            }
        ],
    }
    json_path = tmp_path / "ubbl_amendment.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ubbl_data, f)

    with open(json_path, "rb") as f:
        response = test_client.post(
            "/api/v1/regulations/upload",
            files={"file": (json_path.name, f, "application/json")},
            data={"authority": "DDA"},
        )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["chunks_ingested"] == 1
    assert "green_building" in res_data["categories_detected"]


def test_api_upload_regulations_invalid_format(test_client: TestClient, tmp_path: Path) -> None:
    bad_file = tmp_path / "bad_ext.exe"
    bad_file.write_bytes(b"dummy")

    with open(bad_file, "rb") as f:
        response = test_client.post(
            "/api/v1/regulations/upload",
            files={"file": (bad_file.name, f, "application/octet-stream")},
        )

    assert response.status_code == 400
    assert "Unsupported regulation file type" in response.json()["detail"]
