# Nirmantra AI

AI-powered building safety and regulatory compliance analysis engine for **Delhi NCT, India**.

## Status

✅ **Phases 1–6 Complete** — Production-ready decoupled AI engine & REST API.

## Overview

`nirmantra_ai` is an independent, autonomous AI engine and REST API that provides automated building safety & regulatory compliance audits strictly for **Delhi NCT, India**:

1. **Document Processing**: Parses structured/searchable PDF drawings (PyMuPDF) and scanned drawings (Tesseract OCR).
2. **Parameter Extraction**: LLM-powered extraction with schema validation, metric normalization, and full provenance tracking.
3. **Regulatory Knowledge Base**: ChromaDB vector store seeded with Unified Building Bye-Laws for Delhi 2016 (UBBL-2016).
4. **Deterministic Compliance Rule Engine**: 100% deterministic Python rules for setbacks, FAR, ground coverage, and Delhi Fire Service (DFS) clearance. Zero regulatory hallucinations.
5. **RAG Citations & Grounded Findings**: Statutory citations and actionable remediation steps.
6. **Audit Reporting**: Comprehensive compliance reports with executive score and mandatory Council of Architecture (COA) legal disclaimer.
7. **REST API & Integration Layer**: FastAPI endpoints with CORS enabled for Next.js, React, and external municipal systems.

> ⚠️ This system produces **preliminary compliance advisory reports only**. No output constitutes official building plan sanction, permit approval, structural fitness certification, or legal clearance under the DMC Act or UBBL-2016. All findings must be verified and endorsed by a licensed Architect registered with the Council of Architecture (COA) or an empanelled Structural Engineer.

---

## Quickstart

### 1. Run the Live End-to-End Demo
```bash
python demo.py
```
*Generates a synthetic Delhi building plan, extracts parameters using your configured LLM (OpenRouter / GPT-4o), evaluates all 7 statutory rules, and outputs a formatted compliance audit report.*

### 2. Start the REST API Server
```bash
uvicorn nirmantra_ai.api.app:app --host 127.0.0.1 --port 8000 --reload
```
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Reference**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: `GET http://127.0.0.1:8000/health`

### 3. Frontend & Backend Integration
For frontend engineers (React, Next.js, Vue) and backend developers, refer to the complete:
👉 **[Integration Guide](docs/integration_guide.md)** with TypeScript interface definitions, cURL, and React hook examples.

---

## Setup & Testing

```bash
# Virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -e ".[dev]"

# Configure environment
copy .env.example .env
# Set OPENAI_API_KEY / OPENROUTER key and model in .env

# Run full test suite (106+ unit & integration tests)
pytest -v
```

## Project Structure

```
src/nirmantra_ai/
├── __init__.py        # Exports CompliancePipeline & ComplianceReport
├── config.py          # Settings and environment configuration
├── pipeline.py        # Master orchestrator
├── api/               # FastAPI REST API (app, routes, schemas)
├── document/          # PDF parser (PyMuPDF) & image OCR extractor
├── extraction/        # LLM client & structured parameter extraction
├── compliance/        # Deterministic rules (Setback, FAR, Coverage, Fire Safety)
├── knowledge/         # Vector store (ChromaDB) & Hybrid retriever
├── rag/               # Grounded explanation generator
└── reporting/         # Audit report builder & mandatory statutory disclaimer
```

## Regulatory Scope

- Delhi Master Plan 2041 (MPD-2041)
- Unified Building Bye-Laws for Delhi 2016
- National Building Code 2016 (fire safety sections)
- DDA / MCD notifications

**Not in scope:** Gurugram, Noida, Greater Noida, or other NCR jurisdictions.

## License

Proprietary — All rights reserved.
