"""
Unit tests for document-level regulatory ingestion (JSON, TXT, PDF).
"""

from __future__ import annotations

import json
from pathlib import Path
import fitz
import pytest

from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.ingest import RegulatoryIngester
from nirmantra_ai.knowledge.models import RegulatoryAuthority, RegulatoryCategory
from nirmantra_ai.knowledge.store import RegulatoryStore


@pytest.fixture
def store() -> RegulatoryStore:
    return RegulatoryStore(collection_name="test_doc_ingest", in_memory=True)


@pytest.fixture
def embedding_client() -> DeterministicMockEmbeddingClient:
    return DeterministicMockEmbeddingClient(dimensions=64)


@pytest.fixture
def ingester(store: RegulatoryStore, embedding_client: DeterministicMockEmbeddingClient) -> RegulatoryIngester:
    return RegulatoryIngester(store=store, embedding_client=embedding_client)


def test_ingest_json_file(ingester: RegulatoryIngester, store: RegulatoryStore, tmp_path: Path) -> None:
    json_path = tmp_path / "delhi_ubbl_test.json"
    data = {
        "document_title": "Delhi UBBL 2016 Test Extract",
        "authority": "Delhi Development Authority",
        "provisions": [
            {
                "clause": "Clause 10.1 - Parking",
                "content": "For residential plotted developments, 2.0 ECS per 100 sq. m. shall be provided.",
                "category": "parking",
                "page": "94",
            },
            {
                "clause": "Clause 11.2 - Rainwater Harvesting",
                "content": "Rooftop rainwater harvesting with recharge pit is mandatory for plots 100 sqm and above.",
                "category": "green_building",
                "page": "108",
            },
        ],
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f)

    count = ingester.ingest_document(json_path)
    assert count == 2
    assert store.count() == 2

    chunks = store.get_all_chunks()
    categories = {c.category for c in chunks}
    assert RegulatoryCategory.PARKING in categories
    assert RegulatoryCategory.GREEN_BUILDING in categories


def test_ingest_text_file(ingester: RegulatoryIngester, store: RegulatoryStore, tmp_path: Path) -> None:
    txt_path = tmp_path / "delhi_byelaws.txt"
    text_content = (
        "Clause 7.14.1 - Front Setbacks\n"
        "The minimum front setback for residential plotted development on plots above 250 sqm shall be 6.0m.\n\n"
        "Clause 8.1 - Building Height Restrictions\n"
        "Maximum permissible building height for residential plots is 15.0m without stilt and 17.5m with stilt.\n"
    )
    txt_path.write_text(text_content, encoding="utf-8")

    count = ingester.ingest_document(txt_path, authority=RegulatoryAuthority.DDA)
    assert count >= 2
    assert store.count() >= 2


def test_ingest_pdf_file(ingester: RegulatoryIngester, store: RegulatoryStore, tmp_path: Path) -> None:
    pdf_path = tmp_path / "sample_ubbl_doc.pdf"
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (50, 70),
        "UNIFIED BUILDING BYE-LAWS FOR DELHI 2016\n\n"
        "Clause 9.3 - Fire Safety and Emergency Staircase\n"
        "Buildings above 15.0 metres in height require prior Fire Safety Clearance from the Delhi Fire Service.\n"
        "Minimum staircase width shall be 1.25 metres for residential and 1.50 metres for commercial occupancies.\n",
        fontsize=11,
    )
    doc.save(str(pdf_path))
    doc.close()

    count = ingester.ingest_document(pdf_path, authority=RegulatoryAuthority.DFS)
    assert count >= 1
    assert store.count() >= 1


def test_ingest_unsupported_file_raises(ingester: RegulatoryIngester, tmp_path: Path) -> None:
    bad_path = tmp_path / "invalid.xyz"
    bad_path.write_text("Hello", encoding="utf-8")
    with pytest.raises(ValueError, match="Unsupported regulatory document format"):
        ingester.ingest_document(bad_path)
