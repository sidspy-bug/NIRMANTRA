"""
Shared pytest fixtures for the nirmantra_ai test suite.
"""

from __future__ import annotations

import textwrap
from pathlib import Path

import pytest

# ── Paths ─────────────────────────────────────────────────────────────

TESTS_DIR = Path(__file__).parent
PROJECT_ROOT = TESTS_DIR.parent
SAMPLE_DATA_DIR = PROJECT_ROOT / "data" / "sample"


@pytest.fixture
def sample_data_dir() -> Path:
    """Path to the data/sample/ directory."""
    return SAMPLE_DATA_DIR


@pytest.fixture
def tmp_text_pdf(tmp_path: Path) -> Path:
    """Create a minimal digital PDF with embedded text for testing.

    This uses PyMuPDF (fitz) to generate a real PDF in a temp directory.
    The PDF contains two pages with synthetic building description text.
    """
    import fitz

    doc = fitz.open()

    # Page 1
    page1 = doc.new_page(width=595, height=842)  # A4
    page1.insert_text(
        (72, 100),
        textwrap.dedent("""\
            SYNTHETIC TEST DOCUMENT — NOT A REAL BUILDING PLAN

            Building Name: Test Residential Complex
            Location: Plot No. 42, Sector 5, Dwarka, New Delhi
            Total Built-up Area: 1200 sq. m.
            Number of Floors: Ground + 4
            Building Height: 15.5 metres
            Plot Area: 500 sq. m.
            Year of Construction: 2019
        """),
        fontsize=11,
    )

    # Page 2
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text(
        (72, 100),
        textwrap.dedent("""\
            Fire Safety Provisions:
            - Fire extinguishers on each floor
            - Fire alarm system installed
            - Emergency staircase width: 1.2 metres
            - Refuge area on 3rd floor

            Setback Information:
            - Front setback: 6.0 metres
            - Rear setback: 3.0 metres
            - Side setback (left): 3.0 metres
            - Side setback (right): 3.0 metres
        """),
        fontsize=11,
    )

    pdf_path = tmp_path / "test_building_plan.pdf"
    doc.save(str(pdf_path))
    doc.close()
    return pdf_path


@pytest.fixture
def tmp_empty_pdf(tmp_path: Path) -> Path:
    """Create a PDF with a single blank page."""
    import fitz

    doc = fitz.open()
    doc.new_page(width=595, height=842)
    pdf_path = tmp_path / "empty.pdf"
    doc.save(str(pdf_path))
    doc.close()
    return pdf_path


@pytest.fixture
def tmp_non_pdf(tmp_path: Path) -> Path:
    """Create a non-PDF file for rejection testing."""
    txt_path = tmp_path / "not_a_pdf.txt"
    txt_path.write_text("This is not a PDF.")
    return txt_path
