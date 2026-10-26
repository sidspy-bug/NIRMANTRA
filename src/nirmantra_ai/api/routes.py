"""
REST API endpoints for Nirmantra AI.
"""

from __future__ import annotations

import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status

from nirmantra_ai.api.schemas import (
    AnalyzeTextRequest,
    HealthResponse,
    RegulationSummaryResponse,
    RegulationUploadResponse,
    RuleMetadataResponse,
    RulesListResponse,
)
from nirmantra_ai.document.errors import DocumentProcessingError, OcrError
from nirmantra_ai.extraction.models import BuildingInfo
from nirmantra_ai.knowledge.models import RegulatoryAuthority
from nirmantra_ai.pipeline import SUPPORTED_DOCUMENT_EXTENSIONS, CompliancePipeline
from nirmantra_ai.reporting.models import ComplianceReport

logger = logging.getLogger(__name__)

router = APIRouter()


def get_pipeline(request: Request) -> CompliancePipeline:
    """Dependency provider for the shared CompliancePipeline instance."""
    pipeline = getattr(request.app.state, "pipeline", None)
    if pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Compliance engine is initializing or unavailable.",
        )
    return pipeline


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health and Readiness Check",
    tags=["Diagnostics"],
)
async def health_check(
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> HealthResponse:
    """Returns engine diagnostic status, loaded rules, indexed provisions, and LLM configuration."""
    return HealthResponse(
        status="healthy",
        app="Nirmaantra AI",
        version="0.1.0",
        jurisdiction="Delhi NCT, India",
        rules_loaded=len(pipeline.compliance_engine.rules),
        regulations_loaded=pipeline.store.count(),
        llm_provider=type(pipeline.llm_client).__name__,
        ocr_available=pipeline.is_ocr_available,
    )


@router.get(
    "/api/v1/rules",
    response_model=RulesListResponse,
    summary="List Statutory Compliance Rules",
    tags=["Regulations"],
)
async def list_rules(
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> RulesListResponse:
    """List all registered deterministic building safety rules for Delhi NCT (UBBL-2016, DFS Act)."""
    rules_meta = [
        RuleMetadataResponse(
            rule_id=r.rule_id,
            name=r.rule_name,
            category=r.category.value if hasattr(r.category, "value") else str(r.category),
            citation=r.source_citation,
            authority="DDA / MCD" if "UBBL" in r.source_citation else "DFS",
            description=r.__doc__.strip() if r.__doc__ else r.rule_name,
        )
        for r in pipeline.compliance_engine.rules
    ]
    return RulesListResponse(
        jurisdiction="Delhi NCT, India",
        total_rules=len(rules_meta),
        rules=rules_meta,
    )


@router.post(
    "/api/v1/regulations/upload",
    response_model=RegulationUploadResponse,
    summary="Upload and Index Unified Building Bye-Laws (UBBL) File",
    tags=["Regulations"],
)
async def upload_regulations(
    file: Annotated[UploadFile, File(description="Bye-law file (.json, .pdf, .txt, .md)")],
    document_title: Annotated[str | None, Form(description="Document title override")] = None,
    authority: Annotated[str | None, Form(description="Authority (DDA, MCD, DFS, NDMC, DUAC, NATIONAL)")] = None,
    effective_date: Annotated[str | None, Form(description="Effective date (e.g. '2016-03-22')")] = None,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)] = None,  # type: ignore[assignment]
) -> RegulationUploadResponse:
    """Upload a new Unified Building Bye-Laws or statutory provisions document for RAG indexing.

    Supports:
    - Structured JSON files (list of clause dicts or full export)
    - PDF official bye-laws/gazette notifications
    - Plain text or Markdown provision extracts
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded regulation file must have a valid filename.",
        )

    file_ext = Path(file.filename).suffix.lower()
    allowed_exts = {".json", ".pdf", ".txt", ".md"}
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported regulation file type '{file_ext}'. Allowed: {', '.join(sorted(allowed_exts))}",
        )

    reg_authority = RegulatoryAuthority.DDA
    if authority:
        try:
            reg_authority = RegulatoryAuthority(authority)
        except ValueError:
            for a in RegulatoryAuthority:
                if a.name.lower() == authority.lower() or a.value.lower() == authority.lower():
                    reg_authority = a
                    break

    temp_dir = tempfile.mkdtemp(prefix="nirmantra_reg_")
    temp_file_path = Path(temp_dir) / file.filename

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        title = document_title or Path(file.filename).stem.replace("_", " ").title()
        count = pipeline.ingest_regulatory_file(
            file_path=temp_file_path,
            document_title=title,
            authority=reg_authority,
            effective_date=effective_date or "2016-03-22",
        )

        summary = pipeline.get_regulatory_summary()
        return RegulationUploadResponse(
            status="success",
            document_title=title,
            authority=reg_authority.value,
            chunks_ingested=count,
            total_regulations_indexed=summary["total_chunks"],
            categories_detected=summary["categories"],
            message=f"Successfully parsed and indexed {count} statutory provisions from '{file.filename}'.",
        )
    except Exception as exc:
        logger.error("Failed to process regulation file %s: %s", file.filename, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest regulation file: {str(exc)}",
        ) from exc
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.get(
    "/api/v1/regulations",
    response_model=RegulationSummaryResponse,
    summary="List Loaded Building Regulations and Bye-Laws",
    tags=["Regulations"],
)
async def list_regulations(
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> RegulationSummaryResponse:
    """Inspect all active Unified Building Bye-Laws provisions currently in the RAG knowledge base."""
    summary = pipeline.get_regulatory_summary()
    return RegulationSummaryResponse(
        jurisdiction=summary["jurisdiction"],
        total_chunks=summary["total_chunks"],
        document_titles=summary["document_titles"],
        authorities=summary["authorities"],
        categories=summary["categories"],
        sample_provisions=summary["sample_provisions"],
    )


@router.post(
    "/api/v1/analyze-text",
    response_model=ComplianceReport,
    summary="Analyze Architectural Specifications Text",
    tags=["Analysis"],
)
async def analyze_text(
    payload: AnalyzeTextRequest,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> ComplianceReport:
    """Analyze architectural text, drawing schedules, or specification notes.

    Extracts parameters using LLM, evaluates deterministic statutory rules,
    and returns a complete auditable compliance report.
    """
    try:
        report = pipeline.analyze_text(
            text=payload.text,
            project_name=payload.project_name,
        )
        return report
    except Exception as exc:
        logger.error("Error analyzing text payload: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance analysis failed: {str(exc)}",
        ) from exc


@router.post(
    "/api/v1/analyze-file",
    response_model=ComplianceReport,
    summary="Upload and Analyze Architectural Document (PDF / Drawing Image)",
    tags=["Analysis"],
)
async def analyze_file(
    file: Annotated[UploadFile, File(description="Building submission document (.pdf, .png, .jpg, .jpeg, .tiff)")],
    project_name: Annotated[str | None, Form(description="Optional project name override")] = None,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)] = None,  # type: ignore[assignment]
) -> ComplianceReport:
    """Upload a building sanction drawing or specification sheet for automated compliance audit.

    Supports:
    - Searchable / Structured PDF files (via PyMuPDF parser)
    - Scanned drawing prints / images (via Tesseract OCR extractor)
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_DOCUMENT_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_DOCUMENT_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file_ext}'. Allowed formats: {supported}",
        )

    # Save to a temporary file
    temp_dir = tempfile.mkdtemp(prefix="nirmantra_upload_")
    temp_file_path = Path(temp_dir) / file.filename

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        report = pipeline.analyze_file(
            file_path=temp_file_path,
            project_name=project_name,
        )
        # Ensure source document matches uploaded filename
        report.source_document = file.filename
        return report

    except (DocumentProcessingError, OcrError) as doc_err:
        logger.warning("Document processing error for %s: %s", file.filename, doc_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process document '{file.filename}': {str(doc_err)}",
        ) from doc_err
    except Exception as exc:
        logger.error("Analysis failed for uploaded file %s: %s", file.filename, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance analysis failed: {str(exc)}",
        ) from exc
    finally:
        # Secure cleanup of temporary uploaded file
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post(
    "/api/v1/analyze-parameters",
    response_model=ComplianceReport,
    summary="Direct Parameter Compliance Evaluation",
    tags=["Analysis"],
)
async def analyze_parameters(
    building_info: BuildingInfo,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> ComplianceReport:
    """Evaluate pre-structured building dimensions directly against Delhi statutory rules.

    Ideal for frontend parameter calculator forms and municipal digital submission portals.
    """
    try:
        report = pipeline.analyze_building_info(building_info)
        return report
    except Exception as exc:
        logger.error("Parameter analysis failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rule evaluation failed: {str(exc)}",
        ) from exc


@router.post(
    "/api/v1/report/pdf",
    summary="Export Compliance Report as Downloadable PDF Certificate",
    tags=["Reporting"],
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Downloadable PDF compliance audit certificate.",
        }
    },
)
async def export_report_pdf(
    report: ComplianceReport,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)],
) -> Response:
    """Generate and download a formal PDF compliance audit certificate from a ComplianceReport."""
    try:
        pdf_bytes = pipeline.generate_pdf_report(report)
        filename = f"compliance_audit_{report.report_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as exc:
        logger.error("Failed to render PDF report: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF generation failed: {str(exc)}",
        ) from exc


@router.post(
    "/api/v1/analyze-file/pdf",
    summary="Upload Document and Direct Download PDF Audit Certificate",
    tags=["Analysis", "Reporting"],
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Downloadable PDF audit certificate generated directly from uploaded file.",
        }
    },
)
async def analyze_file_and_download_pdf(
    file: Annotated[UploadFile, File(description="Building submission document (.pdf, .png, .jpg, .jpeg, .tiff)")],
    project_name: Annotated[str | None, Form(description="Optional project name override")] = None,
    pipeline: Annotated[CompliancePipeline, Depends(get_pipeline)] = None,  # type: ignore[assignment]
) -> Response:
    """Upload a drawing/schedule and directly download the publication-grade PDF audit certificate."""
    report = await analyze_file(file=file, project_name=project_name, pipeline=pipeline)
    return await export_report_pdf(report=report, pipeline=pipeline)
