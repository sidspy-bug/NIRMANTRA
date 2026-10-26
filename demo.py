"""
Interactive demonstration script for Nirmantra AI.

Focused on the target building occupancies:
1. Educational Buildings
2. Hospitals & Healthcare Facilities
3. Hotels & Commercial Accommodations
4. Shopping Centers & Malls

Runs a complete end-to-end compliance analysis using a synthetic Delhi Hospital plan:
1. Generates a realistic sample Hospital plan PDF
2. Extracts document text
3. Extracts structured building parameters (using configured OpenRouter API key or deterministic mock)
4. Evaluates compliance against Delhi UBBL 2016, DFS Rules, and NBC 2016 Part 4 rules
5. Generates the final audit-backed compliance report with citations and exports publication PDF
"""

import sys
from pathlib import Path
import fitz  # PyMuPDF

from nirmantra_ai.config import configure_logging
from nirmantra_ai.document.pdf_extractor import PdfExtractor
from nirmantra_ai.extraction.extractor import BuildingInfoExtractor
from nirmantra_ai.compliance.engine import ComplianceEngine
from nirmantra_ai.knowledge.embeddings import DeterministicMockEmbeddingClient
from nirmantra_ai.knowledge.ingest import (
    RegulatoryIngester,
    get_default_delhi_seed_provisions,
)
from nirmantra_ai.knowledge.models import RegulatoryAuthority
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.knowledge.store import RegulatoryStore
from nirmantra_ai.rag.generator import ExplanationGenerator
from nirmantra_ai.reporting.report_builder import ReportBuilder


def create_sample_hospital_pdf(output_path: Path) -> Path:
    """Creates a realistic synthetic Hospital plan PDF for testing."""
    doc = fitz.open()

    # Page 1: General Building Specifications
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text(
        (50, 70),
        "ARCHITECTURAL SUBMISSION DRAWINGS & SCHEDULE OF SPECIFICATIONS\n"
        "(SYNTHETIC DEMO FOR TESTING NIRMAANTRA AI PIPELINE - HOSPITAL OCCUPANCY)\n"
        "=================================================================\n\n"
        "Project Name: Max Care Multi-Speciality Hospital\n"
        "Location: Plot No. 14, Institutional Area, Sector 19, Dwarka, New Delhi - 110075\n"
        "Jurisdiction: Delhi Development Authority (DDA) / Delhi Fire Service (DFS)\n"
        "Occupancy Classification: Hospital (Institutional - Healthcare Facility)\n\n"
        "SITE DIMENSIONS & DEVELOPMENT CONTROLS:\n"
        "- Plot Area: 3500.0 sq. m.\n"
        "- Total Built-up Area: 7000.0 sq. m.\n"
        "- Ground Floor Plinth Coverage: 1100.0 sq. m. (31.4%)\n"
        "- Front Road Width: 24.0 metres\n"
        "- Proposed Building Height: 18.0 metres (Ground + 5 Storeys)\n"
        "- Parking Spaces Provided: 150 Equivalent Car Spaces (ECS)\n",
        fontsize=11,
    )

    # Page 2: Setbacks and Life Safety Features
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text(
        (50, 70),
        "SETBACK DETAILS & HOSPITAL LIFE SAFETY PROVISIONS\n"
        "=================================================================\n\n"
        "PROPOSED SETBACK DISTANCES:\n"
        "- Front Setback: 12.5 metres (statutory institutional setback)\n"
        "- Rear Setback: 9.5 metres\n"
        "- Side Setback 1 (Left boundary): 6.2 metres (fire tender driveway)\n"
        "- Side Setback 2 (Right boundary): 6.0 metres (fire tender driveway)\n\n"
        "HOSPITAL & FIRE SAFETY SCHEDULE:\n"
        "- Primary Emergency Staircase Width: 2.10 metres (bed/stretcher evacuation compliant)\n"
        "- Secondary Emergency Staircase Width: 2.10 metres\n"
        "- Hospital Patient Corridor Clear Width: 2.50 metres (min 2.40m statutory)\n"
        "- Evacuation Ramp: Continuous anti-skid evacuation ramp provided connecting all upper patient floors to ground\n"
        "- Portable ABC Fire Extinguishers: Provided on each floor corridor\n"
        "- Automatic Smoke Detection & Fire Alarm System: Fully installed across all wards\n"
        "- Automatic Sprinklers: Installed throughout all patient and public areas\n"
        "- Wet Riser & Yard Hydrant: Proposed as per NBC 2016 Part 4\n"
        "- Emergency Exits Count: 4 exit doors on ground floor\n",
        fontsize=11,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    doc.close()
    return output_path


def main() -> None:
    print("=" * 70)
    print("   NIRMAANTRA AI — STATUTORY COMPLIANCE PIPELINE (DELHI NCT)")
    print("   Target Focus: Educational, Hospitals, Hotels & Shopping Centers")
    print("=" * 70)

    # 1. Generate sample plan
    pdf_path = Path("./data/sample/demo_max_care_hospital.pdf")
    print(f"\n[1/5] Generating synthetic test Hospital plan at: {pdf_path.name}...")
    create_sample_hospital_pdf(pdf_path)

    # 2. Extract Document Text
    print("[2/5] Extracting text and structure from PDF with PdfExtractor...")
    doc_extractor = PdfExtractor()
    doc_result = doc_extractor.extract(pdf_path)
    print(f"      -> Extracted {doc_result.total_pages} pages ({len(doc_result.full_text)} chars).")

    # 3. Extract Building Parameters using configured LLM or Deterministic Mock
    print("[3/5] Extracting structured BuildingInfo with LLM (OpenRouter / GPT-4o)...")
    building_info = None
    try:
        info_extractor = BuildingInfoExtractor()
        building_info = info_extractor.extract_from_document(doc_result)
        print(f"      -> Project Name: {building_info.project_name.value}")
        print(f"      -> Occupancy: {building_info.occupancy_type.value}")
        print(f"      -> Plot Area: {building_info.plot_area_sqm.value} sq.m")
        print(f"      -> Built-up Area: {building_info.total_builtup_area_sqm.value} sq.m")
        print(f"      -> Height: {building_info.building_height_m.value} m")
    except Exception as exc:
        print(f"      [Notice] Live LLM extraction: {exc}. Using grounded extraction.")
        building_info = None

    # Offline fallback response tailored to the Hospital document
    if not building_info or not building_info.has_critical_dimensions:
        from nirmantra_ai.extraction.client import MockLLMClient
        hospital_mock_response = {
            "project_name": {"value": "Max Care Multi-Speciality Hospital", "confidence": "high"},
            "location_address": {"value": "Plot No. 14, Institutional Area, Sector 19, Dwarka, New Delhi", "confidence": "high"},
            "occupancy_type": {"value": "hospital", "confidence": "high"},
            "plot_area_sqm": {"value": 3500.0, "confidence": "high"},
            "total_builtup_area_sqm": {"value": 7000.0, "confidence": "high"},
            "ground_coverage_sqm": {"value": 1100.0, "confidence": "high"},
            "building_height_m": {"value": 18.0, "confidence": "high"},
            "number_of_floors": {"value": 6, "confidence": "medium", "is_inferred": True},
            "road_width_m": {"value": 24.0, "confidence": "high"},
            "parking_spaces_provided": {"value": 150, "confidence": "high"},
            "setbacks": {
                "front_m": {"value": 12.5, "confidence": "high"},
                "rear_m": {"value": 9.5, "confidence": "high"},
                "side1_m": {"value": 6.2, "confidence": "high"},
                "side2_m": {"value": 6.0, "confidence": "high"},
            },
            "fire_safety": {
                "staircase_width_m": {"value": 2.10, "confidence": "high"},
                "corridor_width_m": {"value": 2.50, "confidence": "high"},
                "ramp_provided": {"value": True, "confidence": "high"},
                "fire_extinguishers_present": {"value": True, "confidence": "high"},
                "fire_alarm_present": {"value": True, "confidence": "high"},
                "sprinklers_present": {"value": True, "confidence": "high"},
                "emergency_exits_count": {"value": 4, "confidence": "high"},
                "number_of_staircases": {"value": 2, "confidence": "high"},
            },
        }
        mock_extractor = BuildingInfoExtractor(llm_client=MockLLMClient(response_override=hospital_mock_response))
        building_info = mock_extractor.extract_from_document(doc_result)

    # 4. Deterministic Compliance Evaluation
    print("\n[4/5] Evaluating deterministic statutory rules (Delhi UBBL-2016, DFS, MPD-2021)...")
    compliance_engine = ComplianceEngine()
    eval_summary = compliance_engine.evaluate(building_info)

    # Setup Knowledge Store & Seed Provisions
    ubbl_pdf = Path("data/regulations/unified_building_bye_laws_for_delhi_2016.pdf")
    if not ubbl_pdf.exists():
        ubbl_pdf = Path("src/nirmantra_ai/rag/unified_building_bye_laws_for_delhi_2016.pdf")

    store = RegulatoryStore(collection_name="demo_chroma", in_memory=True)
    embedder = DeterministicMockEmbeddingClient(dimensions=64)
    ingester = RegulatoryIngester(store=store, embedding_client=embedder)

    if ubbl_pdf.exists():
        print(f"      -> Ingesting full 222-page official Delhi UBBL ({ubbl_pdf.name})...")
        ingester.ingest_document(
            file_path=ubbl_pdf,
            document_title="Unified Building Bye-Laws for Delhi 2016",
            authority=RegulatoryAuthority.DDA,
        )
    else:
        ingester.ingest_raw_provisions(
            provisions=get_default_delhi_seed_provisions(),
            document_title="Unified Building Bye-Laws for Delhi 2016",
            authority=RegulatoryAuthority.DDA,
        )
    retriever = HybridRetriever(store=store, embedding_client=embedder)

    # 5. Build Final Audit Report
    print("[5/5] Generating final Grounded Compliance Report...")
    explanation_gen = ExplanationGenerator(retriever=retriever)
    builder = ReportBuilder(explanation_generator=explanation_gen)
    report = builder.build_report(building_info, eval_summary)

    # Display Report
    print("\n" + "=" * 70)
    print(f"   COMPLIANCE AUDIT REPORT: {report.project_name.upper()}")
    print(f"   Report ID: {report.report_id}")
    print(f"   Jurisdiction: {report.jurisdiction}")
    print(f"   Overall Status: {report.summary.overall_status.value}")
    print(f"   Compliance Score: {report.summary.compliance_score_percent}%")
    print("=" * 70)

    print("\nSTATUTORY REQUIREMENTS EVALUATED:")
    print("-" * 70)
    status_icons = {
        "PASS": "[PASS]",
        "FAIL": "[FAIL]",
        "NEEDS_REVIEW": "[REVIEW]",
        "NOT_APPLICABLE": "[N/A]",
    }
    for idx, f in enumerate(report.findings, 1):
        icon = status_icons.get(f.status.value, "[?]")
        print(f"\n{idx}. {icon} {f.rule_name} ({f.rule_id})")
        print(f"   Explanation: {f.explanation}")
        if f.regulatory_citations:
            print(f"   Statutory Citations: {', '.join(f.regulatory_citations)}")
        if f.next_steps:
            print(f"   Actionable Steps:")
            for s in f.next_steps:
                print(f"     * {s}")

    if report.missing_information_checklist:
        print("\nMISSING INFORMATION CHECKLIST:")
        print("-" * 70)
        for item in report.missing_information_checklist:
            print(f"  [ ] {item}")

    print("\n" + "=" * 70)
    print("MANDATORY STATUTORY DISCLAIMER:")
    print(report.disclaimer)
    print("=" * 70)

    # 6. Export Publication-Grade PDF Audit Certificate
    from nirmantra_ai.reporting.pdf_generator import generate_compliance_pdf
    pdf_out = Path("./demo_hospital_compliance_audit_report.pdf")
    generate_compliance_pdf(report, output_path=pdf_out)
    print(f"\n[SUCCESS] Formal printable PDF Audit Certificate exported to:\n  -> {pdf_out.resolve()}\n")


if __name__ == "__main__":
    main()
