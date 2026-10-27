# NIRMAANTRA AI 🏛️

> **Autonomous AI-Powered Building Safety & Statutory Regulatory Compliance Scrutiny Engine for Delhi NCT, India**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110%2B-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js_16_(Turbopack)-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/Vector_Store-ChromaDB-FF6F61.svg)](https://www.trychroma.com/)
[![PyMuPDF](https://img.shields.io/badge/Document_Parsing-PyMuPDF_2.0-red.svg)](https://pymupdf.readthedocs.io/)
[![Tests Passing](https://img.shields.io/badge/Unit_%26_Integration_Tests-139_Passing-brightgreen.svg)](https://docs.pytest.org/)
[![Jurisdiction](https://img.shields.io/badge/Jurisdiction-Delhi_NCT,_India-FF9933.svg)](#regulatory-scope)

---

## 📌 Executive Summary

**NIRMAANTRA** (*निर्माण + मन्त्र*) is a production-grade, full-stack civic technology engine designed to eradicate fatal building violations, fire hazards, and multi-month municipal scrutiny delays across the **National Capital Territory of Delhi (NCT)**. 

By unifying **computational document processing**, a **100% deterministic Python rule evaluation engine (Zero-Hallucination)**, and **retrieval-augmented statutory citations (Delhi UBBL-2016 / NBC 2016 Part 4)**, NIRMAANTRA transforms architectural scrutiny from a slow, opaque process into an instantaneous, auditable, and transparent digital workflow.

---

## 🚨 The Problem

Rapid urban growth in Delhi NCT has led to devastating municipal and safety crises:
- **Catastrophic Disasters**: Major fire tragedies (Mundka, Karol Bagh, Uphaar) and commercial basement structural failures are repeatedly traced to unverified setbacks, choked fire tender driveways, and missing evacuation routes.
- **Regulatory Maze**: Thousands of dense, interrelated statutory clauses across the **Unified Building Bye-Laws for Delhi 2016 (UBBL-2016)**, **Delhi Master Plan 2041 (MPD-2041)**, and **National Building Code 2016 (NBC-2016)** make manual verification cumbersome and prone to oversights.
- **Approval Backlogs & Opacity**: Manual building sanctions take between 45 to 180 days, creating severe operational friction and opportunities for unauthorized deviation.

---

## 💡 The NIRMAANTRA Solution

```
                                  NIRMAANTRA PLATFORM
 ┌──────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────┐
 │ CITIZEN & APPLICANT  │      │   MUNICIPAL SUPERVISOR  │      │  FIELD INSPECTING    │
 │       PORTAL         │      │     SCRUTINY DESK       │      │       OFFICER        │
 ├──────────────────────┤      ├─────────────────────────┤      ├──────────────────────┤
 │ • Guided Plan Upload │      │ • 3-4 Day Review SLA    │      │ • Geotagged Evidence │
 │ • Instant AI Report  │ ───► │ • Rule 14 AI Overrides  │ ◄─── │ • On-site Checklists │
 │ • QR Safety Passport │      │ • Evidence Attachments  │      │ • 15-Day SLA Clock   │
 │ • Public Grievances  │      │ • Tamper-evident Audit  │      │ • Mobile Field Mode  │
 └──────────────────────┘      └─────────────────────────┘      └──────────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │      NIRMAANTRA AI ENGINE       │
                           │   100% Deterministic Engine     │
                           │   + Grounded UBBL-2016 Vector   │
                           │   + Multi-Format Audit Reports  │
                           └─────────────────────────────────┘
```

---

## 🌟 Key Innovations & Architectural Tenets

### 1. 🛡️ Zero Regulatory Hallucination (Deterministic Rule Engine)
Unlike generic generative AI solutions that hallucinate mathematical formulas or statutory limits, NIRMAANTRA strictly decouples **parameter extraction** from **compliance evaluation**:
- **LLMs** extract dimensions, occupancies, and specifications from drawings and affidavits with full provenance and confidence scoring.
- **100% Deterministic Python Rules** compute Floor Area Ratio (FAR), Ground Coverage, Front/Rear/Side Setbacks, Height controls, Fire Tender clear driveways, and Minimum Staircase/Corridor dimensions.
- If a building has an 18m height with a 4.2m side setback where Delhi Bye-Law 7.14 requires 6.0m, the rule **fails mathematically and deterministically**.

### 2. 🏛️ Focus on High-Risk Delhi Occupancies
Tailored rulesets engineered specifically for major non-residential building categories in Delhi:
- **🏥 Hospitals & Healthcare Facilities**: Mandatory bed/stretcher evacuation staircases (≥ 2.0–2.1m), continuous anti-skid evacuation ramps, minimum 2.40m corridor clear widths, and dedicated hazardous waste safety.
- **🎓 Educational Institutions**: Exit capacities, staircase distribution, playground clearances, and fire separation distances.
- **🏨 Hotels & Commercial Accommodations**: Refuge areas every 7th floor, dual fire towers, and banquet kitchen suppression systems.
- **🛍️ Shopping Centers & Malls**: High-density crowd egress travel distances (≤ 25m), multi-exit door calculations, and automatic sprinkler grids.

### 3. 🔍 Grounded Vector RAG & Statutory Citations
ChromaDB vector store indexed with official Delhi regulatory corpus:
- Unified Building Bye-Laws for Delhi 2016 (**UBBL-2016**)
- Delhi Master Plan 2041 (**MPD-2041**)
- National Building Code 2016 Part 4 (**NBC-2016**)
- Delhi Fire Service Act & Rules (**DFS**)
Every flagged non-compliance is paired with its exact **statutory clause, gazette citation, and actionable remediation steps**.

### 4. 🔏 Auditable Supervisor Override Desk (Rule 14 Filings)
Municipal supervisors can record legitimate exceptions or committee variances:
- Requires a mandatory written justification and original screening baseline.
- **Supporting Evidence Upload**: Allows supervisors to drag-and-drop or upload site survey certificates, committee resolutions, and field reports (PDF, images up to 25MB).
- Stamped into an **immutable, public audit trail** preventing unauthorized backdoor approvals.

### 5. 🏷️ Digital Building Passport & QR Code Plaque
Every sanctioned building is assigned a permanent **Building Unique Identification (UID)**:
- Generates a physical plaque QR code for display at the structure's entrance.
- Citizens, visitors, and fire marshals can scan the QR code to instantly verify fire NOC status, occupancy certificates, structural health, and lift AMCs.

### 6. 📄 Publication-Grade PDF Compliance Reports
ReportLab-powered PDF generation engine that automatically exports official audit dossiers complete with compliance score breakdown, spatial metrics, statutory citations, and the mandatory **Council of Architecture (COA)** legal notice.

---

## 🏛️ System Architecture

```
                                  +-----------------------------+
                                  |   Frontend (Next.js 16)     |
                                  |   Tailwind CSS + Lucide     |
                                  +--------------+--------------+
                                                 |
                                                 | HTTP / JSON / Multipart
                                                 v
                             +---------------------------------------+
                             |       NIRMAANTRA FastAPI Server       |
                             |       http://127.0.0.1:8000           |
                             +-------------------+-------------------+
                                                 |
                     +---------------------------+---------------------------+
                     |                           |                           |
                     v                           v                           v
            +------------------+       +-------------------+       +-------------------+
            | Document Parser  |       | Parameter Extr.   |       | Deterministic     |
            | PyMuPDF / OCR    | ----> | LLM + Pydantic    | ----> | Rule Engine       |
            | Text Extraction  |       | Schema Normalizer |       | (7 Statutory Regs)|
            +------------------+       +-------------------+       +---------+---------+
                                                                             |
                                                                             v
                                                                   +-------------------+
                                                                   | Hybrid Retriever  |
                                                                   | ChromaDB + BM25   |
                                                                   | (UBBL-2016 Seed)  |
                                                                   +---------+---------+
                                                                             |
                                                                             v
                                                                   +-------------------+
                                                                   | Audit Report DTO  |
                                                                   | JSON + PDF Builder|
                                                                   +-------------------+
```

---

## 💻 Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack), **React 19** | Ultra-fast single-window municipal web application |
| **Language & Styling** | **TypeScript 5**, **Tailwind CSS 3.4**, **Shadcn/UI primitives** | Type-safe, accessible, and responsive government UI design |
| **Backend API** | **FastAPI 0.110+**, **Uvicorn**, **Pydantic v2** | High-performance asynchronous REST API with Swagger documentation |
| **Core AI / ML** | **OpenAI GPT-4o** / **OpenRouter**, **text-embedding-3-small** | Structured parameter extraction & natural language remediation RAG |
| **Vector Store** | **ChromaDB 1.5+** (Embedded Vector Database) | Semantic indexing of UBBL-2016 and statutory provisions |
| **Document Processing**| **PyMuPDF 2.0 (fitz)**, **Pillow**, **Tesseract OCR** | Extraction from digital blueprints and scanned drawings |
| **Report Generation** | **ReportLab 5.1** | Publication-ready municipal audit reports and sanction documents |
| **Testing & Quality** | **pytest 9.1**, **pytest-asyncio**, **pytest-cov** | 139+ automated unit and integration tests |

---

## ⚡ Quickstart & Local Installation

### Prerequisites
- **Python 3.10+** (Tested on Python 3.10, 3.11, 3.12, 3.13)
- **Node.js 18+** or **Node.js 22 LTS**
- **Git**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/sidspy-bug/NIRMANTRA.git
cd NIRMANTRA
```

---

### Step 2: Backend Setup (Python & FastAPI)
```bash
# 1. Create and activate a Python virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

# 2. Install backend dependencies
pip install -e ".[dev]"

# 3. Configure environment variables
copy .env.example .env
# Edit .env to supply your OPENAI_API_KEY (or OpenRouter key)

# 4. Start the FastAPI server
uvicorn nirmantra_ai.api.app:app --host 127.0.0.1 --port 8000 --reload
```
- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 3: Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd frontend

# 1. Install Node.js dependencies
npm install

# 2. Configure environment
copy .env.example .env
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

# 3. Start development server
npm run dev
```
- **Frontend Web Portal**: [http://localhost:3000](http://localhost:3000)

---

### Step 4: Run the Live End-to-End CLI Demo
You can also run the self-contained demonstration script that synthesizes a Delhi hospital drawing, extracts parameters, evaluates all statutory rules, and outputs a publication-grade PDF report:
```bash
python demo.py
```
*Output: Generates `demo_hospital_compliance_audit_report.pdf` in the workspace root.*

---

### Step 5: Run the Full Test Suite
```bash
pytest -v
```
```
============================= 139 passed, 4 skipped in 29.61s =============================
```

---

## 🌐 Platform Capabilities & User Roles

| User Role | Credentials / Access | Key Capabilities |
| :--- | :--- | :--- |
| **Citizen / Architect** | Default / `General Public` | Submit 4-step building plan, run automated AI scrutiny, download COA audit report, track application status, and view public building QR passports. |
| **Municipal Supervisor** | Switch role to `Supervisor` in top-right avatar menu | Scrutiny review desk, 3-4 day review SLA monitor, approve/reject plans, record Rule 14 justified AI overrides with supporting evidence upload, and audit logging. |
| **Inspecting Officer** | Switch role to `Inspecting Officer` in top-right avatar menu | Field inspection portal, on-site fire safety checklists, geotagged evidence photo submission, and 15-day enforcement timeline tracking. |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, active rules count, vector chunks, LLM status |
| `GET` | `/api/v1/rules` | Complete catalogue of registered UBBL-2016 statutory compliance rules |
| `POST` | `/api/v1/compliance/analyze` | End-to-end scrutiny from uploaded PDF drawing or raw parameters |
| `POST` | `/api/v1/compliance/report` | Generates a structured JSON compliance report with citations |
| `POST` | `/api/v1/compliance/report/pdf` | Streams a publication-ready compliance audit PDF report |
| `GET` | `/api/v1/regulations/search` | Semantic hybrid search over Delhi UBBL-2016 regulatory provisions |

Interactive documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 📂 Repository Structure

```
NIRMANTRA/
├── demo.py                             # Live end-to-end CLI demonstration script
├── pyproject.toml                      # Python package configuration & dependencies
├── README.md                           # Comprehensive documentation
├── docs/
│   └── integration_guide.md            # Frontend/Backend integration guide with TypeScript DTOs
├── src/nirmantra_ai/                   # Core Python AI Engine
│   ├── api/                            # FastAPI REST API (app, routes, schemas)
│   ├── compliance/                     # 100% Deterministic Python Rule Engine
│   │   ├── engine.py                   # Master evaluation engine
│   │   └── rules/                      # Individual rules (Setback, FAR, Coverage, Height, Fire)
│   ├── document/                       # PDF parser (PyMuPDF) & image OCR (Tesseract)
│   ├── extraction/                     # LLM structured parameter extraction & schema validator
│   ├── knowledge/                      # ChromaDB vector store, embeddings, & UBBL-2016 seeds
│   ├── rag/                            # Grounded statutory explanation & remediation generator
│   └── reporting/                      # Publication-grade PDF report builder (ReportLab)
├── tests/                              # Comprehensive test suite (139+ tests)
│   ├── test_compliance/
│   ├── test_document/
│   ├── test_extraction/
│   ├── test_knowledge/
│   ├── test_rag/
│   └── test_reporting/
└── frontend/                           # Next.js 16 Web Application
    ├── src/
    │   ├── app/                        # App Router pages (submit-plan, applications, supervisor, buildings, etc.)
    │   ├── components/                 # UI components (GovHeader, dossier, review desk, emblems)
    │   ├── context/                    # Auth context & role management
    │   ├── services/                   # API client & ML service bridges
    │   └── types/                      # TypeScript definitions & schemas
    ├── tailwind.config.ts              # Tailwind CSS styling configuration
    └── package.json                    # Node.js dependencies & scripts
```

---

## ⚖️ Statutory Legal Disclaimer

> **⚠️ IMPORTANT STATUTORY NOTICE**  
> `NIRMAANTRA AI` produces **preliminary compliance advisory reports only**. No system output constitutes an official building plan sanction, permit approval, structural fitness certification, or legal clearance under the **Delhi Municipal Corporation Act (DMC Act 1957)** or the **Unified Building Bye-Laws for Delhi 2016 (UBBL-2016)**.  
> 
> All findings, parameter evaluations, and remediation recommendations must be verified and endorsed by a licensed Architect registered with the **Council of Architecture (COA)** under the Architects Act 1972, or an empanelled Structural Engineer registered with the competent municipal authority.

---

## 👥 Hackathon Team & Acknowledgements

Developed with passion for **Smart Governance, Public Safety, and AI Accountability in Urban Infrastructure**.

- **Jurisdiction**: Delhi NCT, India
- **Built for**: National Hackathon Showcase
- **License**: Proprietary / Hackathon Submission — All rights reserved.
