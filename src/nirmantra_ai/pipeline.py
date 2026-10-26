"""
Master Pipeline Orchestrator for Nirmantra AI.

Integrates document processing, parameter extraction, deterministic compliance rules,
vector knowledge retrieval, and grounded explanation generation into a unified interface.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Sequence

from nirmantra_ai.compliance.engine import ComplianceEngine
from nirmantra_ai.compliance.models import ComplianceEvaluationSummary
from nirmantra_ai.config import Settings, get_settings
from nirmantra_ai.document.errors import (
    DocumentError,
    DocumentProcessingError,
    OcrError,
    OcrNotAvailableError,
)
from nirmantra_ai.document.models import DocumentExtractionResult, ExtractionResult
from nirmantra_ai.document.ocr_extractor import OcrExtractor
from nirmantra_ai.document.pdf_extractor import PdfExtractor
from nirmantra_ai.extraction.client import LLMClient, MockLLMClient, OpenAILLMClient
from nirmantra_ai.extraction.extractor import BuildingInfoExtractor
from nirmantra_ai.extraction.models import BuildingInfo
from nirmantra_ai.knowledge.embeddings import (
    DeterministicMockEmbeddingClient,
    EmbeddingClient,
    OpenAIEmbeddingClient,
)
from nirmantra_ai.knowledge.ingest import (
    RegulatoryIngester,
    get_default_delhi_seed_provisions,
)
from nirmantra_ai.knowledge.models import RegulatoryAuthority
from nirmantra_ai.knowledge.retriever import HybridRetriever
from nirmantra_ai.knowledge.store import RegulatoryStore
from nirmantra_ai.rag.generator import ExplanationGenerator
from nirmantra_ai.reporting.models import ComplianceReport
from nirmantra_ai.reporting.pdf_generator import generate_compliance_pdf
from nirmantra_ai.reporting.report_builder import ReportBuilder

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}
SUPPORTED_DOCUMENT_EXTENSIONS = {".pdf"} | SUPPORTED_IMAGE_EXTENSIONS


class CompliancePipeline:
    """End-to-end compliance analysis engine for Delhi NCT building regulations.

    Coordinates:
      1. Document ingestion (PDF parsing and OCR image processing)
      2. Structured parameter extraction with schema validation and provenance tracking
      3. Deterministic rule evaluation against Delhi UBBL-2016 and DFS Act
      4. Hybrid semantic/keyword retrieval from regulatory knowledge base
      5. Grounded RAG explanation and actionable step generation
      6. Final auditable compliance report compilation with legal disclaimer
    """

    def __init__(
        self,
        settings: Settings | None = None,
        llm_client: LLMClient | None = None,
        embedding_client: EmbeddingClient | None = None,
        store: RegulatoryStore | None = None,
        retriever: HybridRetriever | None = None,
        compliance_engine: ComplianceEngine | None = None,
        explanation_generator: ExplanationGenerator | None = None,
        report_builder: ReportBuilder | None = None,
        doc_extractor: PdfExtractor | None = None,
        ocr_extractor: OcrExtractor | None = None,
        seed_knowledge_base: bool = True,
    ) -> None:
        self.settings = settings or get_settings()

        # 1. LLM Client
        if llm_client is not None:
            self.llm_client = llm_client
        elif self.settings.llm_api_key:
            self.llm_client = OpenAILLMClient(
                api_key=self.settings.llm_api_key,
                model=self.settings.llm_model,
                base_url=self.settings.openai_base_url,
            )
        else:
            self.llm_client = MockLLMClient()

        # 2. Embedding Client
        if embedding_client is not None:
            self.embedding_client = embedding_client
        else:
            # Deterministic mock embedder is default for fast, zero-external-cost vector search
            self.embedding_client = DeterministicMockEmbeddingClient(dimensions=64)

        # 3. Regulatory Store & Retriever
        if store is not None:
            self.store = store
        else:
            self.store = RegulatoryStore(
                collection_name="nirmantra_delhi_regulations",
                in_memory=True,
            )

        if seed_knowledge_base and self.store.count() == 0:
            self._seed_store()

        if retriever is not None:
            self.retriever = retriever
        else:
            self.retriever = HybridRetriever(
                store=self.store,
                embedding_client=self.embedding_client,
            )

        # 4. Extractors
        self.doc_extractor = doc_extractor or PdfExtractor()
        if ocr_extractor is not None:
            self.ocr_extractor = ocr_extractor
        else:
            try:
                self.ocr_extractor = OcrExtractor()
            except OcrNotAvailableError:
                self.ocr_extractor = None
                logger.info("Tesseract OCR binary not detected; PDF extraction active, image OCR offline.")

        self.info_extractor = BuildingInfoExtractor(llm_client=self.llm_client)

        # 5. Compliance & Reporting
        self.compliance_engine = compliance_engine or ComplianceEngine()
        self.explanation_generator = explanation_generator or ExplanationGenerator(
            llm_client=self.llm_client,
            retriever=self.retriever,
        )
        self.report_builder = report_builder or ReportBuilder(
            explanation_generator=self.explanation_generator,
        )

        logger.info(
            "CompliancePipeline initialized (LLM=%s, Rules=%d, KnowledgeChunks=%d, OCR=%s)",
            type(self.llm_client).__name__,
            len(self.compliance_engine.rules),
            self.store.count(),
            "Enabled" if self.ocr_extractor is not None else "Disabled",
        )

    @property
    def is_ocr_available(self) -> bool:
        """Returns True if OCR extractor is initialized and ready."""
        return self.ocr_extractor is not None

    def _seed_store(self) -> None:
        """Seed Delhi UBBL-2016 statutory provisions into the vector store."""
        ingester = RegulatoryIngester(
            store=self.store,
            embedding_client=self.embedding_client,
        )
        provisions = get_default_delhi_seed_provisions()
        ingester.ingest_raw_provisions(
            provisions=provisions,
            document_title="Unified Building Bye-Laws for Delhi 2016",
            authority=RegulatoryAuthority.DDA,
        )
        logger.info("Seeded %d Delhi UBBL provisions into regulatory store", len(provisions))

    def analyze_file(
        self,
        file_path: Path | str,
        project_name: str | None = None,
    ) -> ComplianceReport:
        """Analyze a submission document file (PDF or scanned image).

        Args:
            file_path: Path to the target document.
            project_name: Optional override for the project name.

        Returns:
            Auditable ComplianceReport.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If file format is unsupported.
            OcrNotAvailableError: If an image file is submitted without Tesseract installed.
            DocumentProcessingError: If extraction fails.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Document file not found: {file_path}")

        suffix = path.suffix.lower()
        if suffix not in SUPPORTED_DOCUMENT_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_DOCUMENT_EXTENSIONS))
            raise ValueError(
                f"Unsupported document format '{suffix}'. Supported formats: {supported}"
            )

        logger.info("Processing document file: %s (type=%s)", path.name, suffix)

        if suffix == ".pdf":
            doc_result = self.doc_extractor.extract(path)
        else:
            if self.ocr_extractor is None:
                raise OcrNotAvailableError(
                    f"Cannot process image '{path.name}' because Tesseract OCR is not installed or configured. "
                    "Please install Tesseract OCR or submit searchable PDF drawings."
                )
            doc_result = self.ocr_extractor.extract(path)

        return self.analyze_document(doc_result, project_name_override=project_name)

    def analyze_document(
        self,
        doc_result: DocumentExtractionResult,
        project_name_override: str | None = None,
    ) -> ComplianceReport:
        """Analyze an already-extracted DocumentExtractionResult.

        Args:
            doc_result: Result from PDF or OCR extraction.
            project_name_override: Optional project name override.

        Returns:
            Auditable ComplianceReport.
        """
        building_info = self.info_extractor.extract_from_document(doc_result)
        if project_name_override:
            building_info.project_name.value = project_name_override

        return self.analyze_building_info(
            building_info=building_info,
            source_filename=doc_result.source_filename,
        )

    def analyze_text(
        self,
        text: str,
        project_name: str | None = None,
        source_filename: str | None = None,
    ) -> ComplianceReport:
        """Analyze plain architectural schedule text.

        Args:
            text: Architectural specifications or drawing schedule text.
            project_name: Optional project name.
            source_filename: Optional source descriptor.

        Returns:
            Auditable ComplianceReport.
        """
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        building_info = self.info_extractor.extract(text, project_name=project_name)
        return self.analyze_building_info(
            building_info=building_info,
            source_filename=source_filename or "direct_text_input",
        )

    def analyze_building_info(
        self,
        building_info: BuildingInfo,
        source_filename: str | None = None,
    ) -> ComplianceReport:
        """Directly evaluate a structured BuildingInfo model against compliance rules.

        Args:
            building_info: Structured parameters with provenance metadata.
            source_filename: Optional filename reference.

        Returns:
            Auditable ComplianceReport.
        """
        if source_filename and not building_info.source_filename:
            building_info.source_filename = source_filename

        # 1. Deterministic Rule Evaluation
        eval_summary: ComplianceEvaluationSummary = self.compliance_engine.evaluate(building_info)

        # 2. Build Report with Grounded Explanations & Citations
        report: ComplianceReport = self.report_builder.build_report(building_info, eval_summary)

        logger.info(
            "Completed analysis for '%s': Status=%s, Score=%.1f%% (%d checks)",
            report.project_name,
            report.summary.overall_status.value,
            report.summary.compliance_score_percent,
            report.summary.total_requirements_checked,
        )
        return report

    def generate_pdf_report(
        self,
        report: ComplianceReport,
        output_path: Path | str | None = None,
    ) -> bytes | Path:
        """Export an auditable ComplianceReport as a formatted publication-grade PDF certificate.

        Args:
            report: Populated ComplianceReport.
            output_path: Target file path on disk. If None, returns raw bytes in-memory.

        Returns:
            Path if written to disk, or bytes if output_path is None.
        """
        return generate_compliance_pdf(report=report, output_path=output_path)

    def ingest_regulatory_file(
        self,
        file_path: Path | str,
        document_title: str | None = None,
        authority: RegulatoryAuthority = RegulatoryAuthority.DDA,
        effective_date: str = "2016-03-22",
    ) -> int:
        """Ingest a new Unified Building Bye-Laws file (PDF, JSON, TXT, or MD) into the knowledge base.

        Args:
            file_path: Path to the regulatory document.
            document_title: Optional title override. Defaults to filename or inferred title.
            authority: Regulatory authority issuing the bye-law (DDA, MCD, DFS, NDMC, etc.).
            effective_date: Effective date string.

        Returns:
            Number of regulatory chunks parsed and indexed.
        """
        ingester = RegulatoryIngester(
            store=self.store,
            embedding_client=self.embedding_client,
        )
        return ingester.ingest_document(
            file_path=file_path,
            document_title=document_title,
            authority=authority,
            effective_date=effective_date,
        )

    def ingest_regulatory_provisions(
        self,
        provisions: list[dict[str, str]],
        document_title: str,
        authority: RegulatoryAuthority = RegulatoryAuthority.DDA,
        effective_date: str = "2016-03-22",
    ) -> int:
        """Ingest structured provision dictionaries directly into the knowledge base."""
        ingester = RegulatoryIngester(
            store=self.store,
            embedding_client=self.embedding_client,
        )
        return ingester.ingest_raw_provisions(
            provisions=provisions,
            document_title=document_title,
            authority=authority,
            effective_date=effective_date,
        )

    def get_regulatory_summary(self) -> dict[str, Any]:
        """Retrieve summary of all indexed bye-laws and regulations."""
        chunks = self.store.get_all_chunks(limit=200)
        authorities = sorted(list({c.source.authority.value for c in chunks}))
        categories = sorted(list({c.category.value for c in chunks}))
        titles = sorted(list({c.source.document_title for c in chunks}))
        return {
            "jurisdiction": "Delhi NCT, India",
            "total_chunks": self.store.count(),
            "document_titles": titles,
            "authorities": authorities,
            "categories": categories,
            "sample_provisions": [
                {
                    "chunk_id": c.chunk_id,
                    "clause": c.source.clause_or_section,
                    "document": c.source.document_title,
                    "authority": c.source.authority.value,
                    "category": c.category.value,
                    "excerpt": c.content[:150] + "..." if len(c.content) > 150 else c.content,
                }
                for c in chunks[:10]
            ],
        }
