"""
Ingestion pipeline for regulatory documents into the knowledge base.

Chunks legal and bye-law texts while preserving clause boundaries,
extracts keywords, generates embeddings, and writes to RegulatoryStore.
"""

from __future__ import annotations

import logging
from pathlib import Path
import re
from typing import Sequence

from nirmantra_ai.knowledge.embeddings import EmbeddingClient
from nirmantra_ai.knowledge.models import (
    RegulatoryAuthority,
    RegulatoryCategory,
    RegulatoryChunk,
    SourceReference,
)
from nirmantra_ai.knowledge.store import RegulatoryStore

logger = logging.getLogger(__name__)

# Heuristic category mappings based on keywords
_CATEGORY_KEYWORDS: dict[RegulatoryCategory, list[str]] = {
    RegulatoryCategory.SETBACK: ["setback", "front setback", "rear setback", "side setback", "open space"],
    RegulatoryCategory.FAR: ["far", "floor area ratio", "built up area", "floor space index"],
    RegulatoryCategory.GROUND_COVERAGE: ["ground coverage", "maximum ground coverage", "plinth area"],
    RegulatoryCategory.HEIGHT: ["height", "maximum height", "building height", "stilt"],
    RegulatoryCategory.FIRE_SAFETY: ["fire", "staircase", "refuge", "sprinkler", "extinguisher", "fire escape", "dfs"],
    RegulatoryCategory.PARKING: ["parking", "ecs", "equivalent car space", "basement parking"],
    RegulatoryCategory.STRUCTURAL: ["earthquake", "seismic", "structural safety", "structural stability"],
}


class RegulatoryIngester:
    """Ingests regulatory documents and clauses into a RegulatoryStore."""

    def __init__(
        self,
        store: RegulatoryStore,
        embedding_client: EmbeddingClient,
    ) -> None:
        self.store = store
        self.embedding_client = embedding_client

    def ingest_chunks(self, chunks: Sequence[RegulatoryChunk]) -> int:
        """Embed and store a collection of pre-structured regulatory chunks."""
        if not chunks:
            return 0

        texts = [c.content for c in chunks]
        logger.info("Generating embeddings for %d regulatory chunks...", len(chunks))
        embeddings = self.embedding_client.embed_texts(texts)

        return self.store.add_chunks(list(chunks), embeddings)

    def ingest_raw_provisions(
        self,
        provisions: list[dict[str, str]],
        document_title: str,
        authority: RegulatoryAuthority,
        effective_date: str = "2016-03-22",
    ) -> int:
        """Helper to ingest a list of raw clause dictionaries.

        Expected dict keys: 'clause', 'content', 'page' (optional), 'category' (optional).
        """
        chunks: list[RegulatoryChunk] = []

        for idx, item in enumerate(provisions):
            clause = item.get("clause", f"Section-{idx+1}")
            content = item.get("content", "").strip()
            if not content:
                continue

            page = int(item["page"]) if "page" in item and item["page"] else None

            # Determine category
            category_str = item.get("category")
            if category_str:
                category = RegulatoryCategory(category_str)
            else:
                category = self._detect_category(content)

            keywords = self._extract_keywords(content)
            chunk_id = self._generate_chunk_id(document_title, clause, idx)

            source = SourceReference(
                document_title=document_title,
                authority=authority,
                clause_or_section=clause,
                page_number=page,
                effective_date=effective_date,
                jurisdiction="Delhi NCT",
                is_verified=True,
            )

            chunks.append(
                RegulatoryChunk(
                    chunk_id=chunk_id,
                    content=content,
                    source=source,
                    category=category,
                    keywords=keywords,
                )
            )

        return self.ingest_chunks(chunks)

    def ingest_document(
        self,
        file_path: Path | str,
        document_title: str | None = None,
        authority: RegulatoryAuthority = RegulatoryAuthority.DDA,
        effective_date: str = "2016-03-22",
    ) -> int:
        """Parse and ingest a Unified Building Bye-Laws document (.json, .pdf, .txt, .md).

        Args:
            file_path: Path to the target bye-law or regulatory document.
            document_title: Human-readable title of the document. Defaults to stem name.
            authority: Issuing regulatory authority (DDA, MCD, DFS, etc.).
            effective_date: Effective date string (ISO YYYY-MM-DD or year).

        Returns:
            Total count of regulatory chunks indexed.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Regulatory file not found: {file_path}")

        doc_title = document_title or path.stem.replace("_", " ").title()
        suffix = path.suffix.lower()

        logger.info("Ingesting regulatory document: %s (format=%s, authority=%s)", path.name, suffix, authority.value)

        if suffix == ".json":
            return self._ingest_json_file(
                path=path,
                default_title=doc_title,
                default_authority=authority,
                default_effective_date=effective_date,
            )
        elif suffix == ".pdf":
            return self._ingest_pdf_file(
                path=path,
                document_title=doc_title,
                authority=authority,
                effective_date=effective_date,
            )
        elif suffix in {".txt", ".md"}:
            return self._ingest_text_file(
                path=path,
                document_title=doc_title,
                authority=authority,
                effective_date=effective_date,
            )
        else:
            raise ValueError(
                f"Unsupported regulatory document format '{suffix}'. Supported: .json, .pdf, .txt, .md"
            )

    def ingest_directory(
        self,
        dir_path: Path | str,
        authority: RegulatoryAuthority = RegulatoryAuthority.DDA,
        effective_date: str = "2016-03-22",
    ) -> int:
        """Ingest all regulatory files within a directory."""
        path = Path(dir_path)
        if not path.is_dir():
            raise NotADirectoryError(f"Directory not found: {dir_path}")

        total_ingested = 0
        supported_exts = {".json", ".pdf", ".txt", ".md"}

        for f in sorted(path.rglob("*")):
            if f.is_file() and f.suffix.lower() in supported_exts:
                try:
                    count = self.ingest_document(
                        file_path=f,
                        authority=authority,
                        effective_date=effective_date,
                    )
                    total_ingested += count
                except Exception as exc:
                    logger.error("Failed to ingest %s: %s", f.name, exc)

        return total_ingested

    def _ingest_json_file(
        self,
        path: Path,
        default_title: str,
        default_authority: RegulatoryAuthority,
        default_effective_date: str,
    ) -> int:
        """Parse structured JSON containing provisions or bye-law clauses."""
        import json

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        provisions: list[dict[str, str]] = []
        doc_title = default_title
        authority = default_authority
        effective_date = default_effective_date

        if isinstance(data, list):
            provisions = data
        elif isinstance(data, dict):
            doc_title = data.get("document_title", default_title)
            auth_str = data.get("authority")
            if auth_str:
                try:
                    authority = RegulatoryAuthority(auth_str)
                except ValueError:
                    authority = default_authority
            effective_date = data.get("effective_date", default_effective_date)
            provisions = data.get("provisions") or data.get("clauses") or []

        return self.ingest_raw_provisions(
            provisions=provisions,
            document_title=doc_title,
            authority=authority,
            effective_date=effective_date,
        )

    def _ingest_pdf_file(
        self,
        path: Path,
        document_title: str,
        authority: RegulatoryAuthority,
        effective_date: str,
    ) -> int:
        """Extract text page by page from a regulatory PDF and chunk into clauses."""
        import fitz  # PyMuPDF

        doc = fitz.open(str(path))
        provisions: list[dict[str, Any]] = []

        try:
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text()
                if not text or not text.strip():
                    continue

                page_provisions = self._split_regulatory_text(
                    text=text,
                    page_number=page_idx + 1,
                )
                provisions.extend(page_provisions)
        finally:
            doc.close()

        # If individual pages didn't have headings, aggregate whole document
        if not provisions:
            doc = fitz.open(str(path))
            full_text = "\n".join(doc[i].get_text() for i in range(len(doc)))
            doc.close()
            provisions = self._split_regulatory_text(full_text)

        return self.ingest_raw_provisions(
            provisions=provisions,
            document_title=document_title,
            authority=authority,
            effective_date=effective_date,
        )

    def _ingest_text_file(
        self,
        path: Path,
        document_title: str,
        authority: RegulatoryAuthority,
        effective_date: str,
    ) -> int:
        """Extract and chunk plain text or markdown regulatory provisions."""
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

        provisions = self._split_regulatory_text(text)
        return self.ingest_raw_provisions(
            provisions=provisions,
            document_title=document_title,
            authority=authority,
            effective_date=effective_date,
        )

    @classmethod
    def _split_regulatory_text(
        cls,
        text: str,
        page_number: int | None = None,
    ) -> list[dict[str, Any]]:
        """Splits regulatory bye-law text into individual clause sections."""
        # Pattern matching statutory headers: Clause X, Section X, Table X, Chapter X, Rule X, or 9.3 Fire Safety
        clause_pattern = re.compile(
            r"(?m)^(?:\s*(?:(?:Clause|Section|Rule|Chapter|Table|Bye-Law|Part|Annexure)\s+[0-9A-Za-z\.\-]+|[0-9]{1,2}\.[0-9]+(?:\.[0-9]+)*\.?)\s+[A-Za-z][^\n]*)"
        )

        matches = list(clause_pattern.finditer(text))
        provisions: list[dict[str, Any]] = []

        if matches:
            for i, match in enumerate(matches):
                clause_header = match.group(0).strip()
                start = match.start()
                end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
                clause_body = text[start:end].strip()

                # Clean up heading
                first_line = clause_header.split("\n")[0].strip()
                clause_title = first_line[:60]

                if len(clause_body) > 30:  # meaningful provision length
                    provisions.append({
                        "clause": clause_title,
                        "content": clause_body,
                        "page": str(page_number) if page_number else None,
                        "category": cls._detect_category(clause_body).value,
                    })
        else:
            # Fallback: split by double line breaks / paragraphs
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 40]
            for idx, para in enumerate(paragraphs):
                provisions.append({
                    "clause": f"Section {idx + 1}",
                    "content": para,
                    "page": str(page_number) if page_number else None,
                    "category": cls._detect_category(para).value,
                })

        return provisions

    @staticmethod
    def _detect_category(text: str) -> RegulatoryCategory:
        """Infer compliance category from text content."""
        lower = text.lower()
        for cat, kws in _CATEGORY_KEYWORDS.items():
            if any(kw in lower for kw in kws):
                return cat
        return RegulatoryCategory.GENERAL

    @staticmethod
    def _extract_keywords(text: str) -> list[str]:
        """Extract key technical terms from provision content."""
        words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
        candidates = {
            "setback", "staircase", "height", "coverage", "ratio", "floor",
            "residential", "commercial", "sprinkler", "alarm", "refuge",
            "parking", "seismic", "basement", "extinguisher", "metres",
            "green", "solar", "rainwater", "harvesting", "structural",
        }
        return sorted(list(set(words) & candidates))

    @staticmethod
    def _generate_chunk_id(doc_title: str, clause: str, idx: int) -> str:
        clean_doc = re.sub(r"[^a-zA-Z0-9]", "_", doc_title.lower())[:15]
        clean_clause = re.sub(r"[^a-zA-Z0-9]", "_", clause.lower())[:20]
        return f"{clean_doc}_{clean_clause}_{idx}"


def get_default_delhi_seed_provisions() -> list[dict[str, str]]:
    """Verified foundational clauses from the Unified Building Bye-Laws for Delhi 2016 and MPD-2021."""
    return [
        {
            "clause": "Clause 7.14.1",
            "category": "setback",
            "page": "45",
            "content": (
                "For residential plotted development in Delhi NCT up to 250 sq. m., "
                "the minimum front setback shall be 3.0 metres and rear setback shall be 2.0 metres. "
                "For plots above 250 sq. m. up to 500 sq. m., the minimum front setback shall be 6.0 metres, "
                "rear setback shall be 3.0 metres, and side setback shall be 3.0 metres."
            ),
        },
        {
            "clause": "Clause 7.13 - Institutional & Commercial Setbacks",
            "category": "setback",
            "page": "44",
            "content": (
                "For Educational, Hospital, Hotel, and Shopping Center buildings in Delhi NCT, "
                "front setbacks shall be a minimum of 6.0 metres for plots up to 500 sq. m., 9.0 metres for plots up to 1500 sq. m., "
                "12.0 metres for plots up to 5000 sq. m., and 15.0 metres for larger plots. Rear setback shall be minimum 3.0m to 9.0m, "
                "and clear side setbacks/driveways of 6.0 metres are mandatory around the structure for fire tender movement."
            ),
        },
        {
            "clause": "Table 7.1 - FAR & Coverage",
            "category": "floor_area_ratio",
            "page": "48",
            "content": (
                "For residential plots in Delhi, the maximum Ground Coverage for plots between 250 sq. m. "
                "and 750 sq. m. shall not exceed 75% for 250 sq.m to 500 sq.m (or 50% for larger plots). "
                "The maximum Floor Area Ratio (FAR) permitted without compounding shall be 300 for residential plots."
            ),
        },
        {
            "clause": "MPD-2021 Development Controls - Educational, Hospitals & Commercial",
            "category": "floor_area_ratio",
            "page": "50",
            "content": (
                "Development Controls under MPD-2021 and UBBL-2016: "
                "1. Educational buildings (Schools/Colleges): Permissible FAR is 150 (up to 225 on roads >= 24m) and maximum Ground Coverage is 35%. "
                "2. Hospitals & Healthcare facilities: Permissible FAR is 250 (up to 375 on roads >= 24m) and maximum Ground Coverage is 35%. "
                "3. Commercial Hotels: Permissible FAR is 225 (up to 325 on roads >= 24m) and maximum Ground Coverage is 40%. "
                "4. Shopping Centers and Commercial Complexes: Permissible FAR is 150 to 200 and maximum Ground Coverage is 40%."
            ),
        },
        {
            "clause": "Clause 8.1 - Building Height",
            "category": "building_height",
            "page": "52",
            "content": (
                "The maximum permissible building height for residential plotted development in Delhi NCT "
                "shall be 15.0 metres without stilt, and 17.5 metres with stilt parking, subject to road width "
                "and airport obstacle limitation surfaces."
            ),
        },
        {
            "clause": "Table 8.1 & Clause 8.4.3 - Minimum Exit Staircase Width",
            "category": "fire_safety",
            "page": "76",
            "content": (
                "Under UBBL-2016 Table 8.1 and Clause 8.4.3, the minimum clear width of emergency exit staircases shall be: "
                "1. Hospitals and Healthcare facilities: Minimum 2.00 metres to accommodate stretcher and hospital bed evacuation. "
                "2. Shopping Centers, Malls and Mercantile buildings: Minimum 2.00 metres to ensure rapid mass evacuation. "
                "3. Educational Buildings (Schools and Colleges): Minimum 1.50 metres. "
                "4. Commercial Hotels and Guest Accommodations: Minimum 1.50 metres. "
                "5. Residential Buildings: 1.25 metres for high-rise above 15m, and 1.00 metre for low-rise plotted housing."
            ),
        },
        {
            "clause": "Clause 8.4.2 & NBC Part 4 - Hospital Corridor & Evacuation Ramp",
            "category": "fire_safety",
            "page": "77",
            "content": (
                "In all hospitals and healthcare facilities accommodating in-patients, public and patient corridors shall have "
                "a minimum clear width of 2.40 metres to facilitate uninterrupted movement of beds and stretchers. "
                "Additionally, dedicated evacuation ramps with anti-skid surfaces (slope not steeper than 1:10 to 1:12) "
                "shall be provided from all upper patient care floors directly to safe ground level."
            ),
        },
        {
            "clause": "Clause 9.3.2 & NBC 2016 Part 4 - Shopping Center Exit Travel Distance",
            "category": "fire_safety",
            "page": "79",
            "content": (
                "In shopping centers, department stores, and mercantile complexes, the maximum travel distance from any point "
                "in the building to the nearest emergency exit staircase enclosure shall not exceed 30.0 metres. "
                "A minimum of two continuous independent exit staircases remotely located from each other shall be provided for each floor."
            ),
        },
        {
            "clause": "Clause 9.3 & DFS Rules 2010 - Fire Clearance (DFS NOC) Triggers",
            "category": "fire_safety",
            "page": "78",
            "content": (
                "Under Delhi Fire Service (DFS) Rules 2010 (Rule 27) and UBBL-2016 Clause 9.3, mandatory Prior Fire Safety Clearance "
                "(DFS NOC) is required for: "
                "1. Educational buildings with height exceeding 9.0 metres or more than 2 storeys. "
                "2. All Hospitals, nursing homes, and healthcare institutions having height exceeding 9.0 metres or accommodating in-patient beds. "
                "3. Hotels, motels, and guest houses with height exceeding 12.0 metres or having more than ground plus two storeys. "
                "4. Shopping centers, malls, and mercantile buildings with height exceeding 9.0 metres or covered area exceeding 500 sq. m. "
                "5. All other high-rise buildings exceeding 15.0 metres in height."
            ),
        },
        {
            "clause": "Clause 9.5 - Fire Detection & Extinguishers",
            "category": "fire_safety",
            "page": "82",
            "content": (
                "All educational, hospital, hotel, shopping center, and high-rise buildings must provide portable fire extinguishers "
                "on each floor, manual call points, an automatic fire alarm system, and wet risers with yard hydrants as per NBC 2016 Part 4. "
                "Automatic sprinkler protection is mandatory for hospitals, hotels, and shopping malls."
            ),
        },
        {
            "clause": "Clause 10.1 & MPD-2021 Table 17.1 - Parking Standards (ECS)",
            "category": "parking",
            "page": "88",
            "content": (
                "Statutory parking requirements in Delhi NCT shall be calculated in Equivalent Car Spaces (ECS) per 100 sq. m. of built-up area: "
                "1. Commercial Hotels: 3.0 ECS per 100 sq. m. "
                "2. Shopping Centers, Malls, and Retail Complexes: 3.0 ECS per 100 sq. m. "
                "3. Hospitals and Healthcare facilities: 2.0 ECS per 100 sq. m. "
                "4. Educational Institutes (Colleges / Higher Education): 1.5 to 2.0 ECS per 100 sq. m. (Schools: 1.0 to 1.5 ECS). "
                "5. Residential Plotted / Group Housing: 2.0 ECS per 100 sq. m."
            ),
        },
    ]
