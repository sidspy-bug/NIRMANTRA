# NIRMAANTRA AI — Frontend & Backend Integration Guide

Welcome to the **NIRMAANTRA AI** Integration Guide. This document provides everything external frontend engineers (React, Next.js, Vue, mobile) and backend services need to seamlessly integrate with the NIRMAANTRA Building Safety & Compliance AI Layer.

---

## 1. System Overview & Architecture

NIRMAANTRA is a zero-coupling, autonomous compliance engine specialized for **Delhi NCT, India** (Unified Building Bye-Laws for Delhi 2016, Master Plan for Delhi 2041, Delhi Fire Service Act, NBC 2016 Part 4).

### Key Architectural Tenets:
- **Zero Database / UI Coupling**: NIRMAANTRA does not dictate your database, authentication, or UI stack. It accepts documents or text and returns auditable, JSON-structured compliance reports.
- **Deterministic Evaluation**: Pass/Fail compliance checks are evaluated by 100% deterministic Python rules. LLMs are used exclusively for parameter extraction and natural language explanations—preventing regulatory hallucinations.
- **Mandatory Statutory Disclaimer**: Every generated report carries a statutory disclaimer explicitly requiring verification by a Council of Architecture (COA) registered architect or empanelled structural engineer.

```
                      +-----------------------------+
                      |   Frontend (Next.js / UI)   |
                      +--------------+--------------+
                                     |
                                     | Multipart PDF / JSON
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
| (PyMuPDF / OCR)  | ----> | (LLM + Provenance)| ----> | Rule Engine       |
+------------------+       +-------------------+       +---------+---------+
                                                                 |
                                                                 v
                                                       +-------------------+
                                                       | RAG & Citations   |
                                                       | (Delhi UBBL-2016) |
                                                       +---------+---------+
                                                                 |
                                                                 v
                                                       +-------------------+
                                                       | Audit Report DTO  |
                                                       +-------------------+
```

---

## 2. Server Startup & Interactive Documentation

### Starting the Server Locally:
```bash
# In the repository root:
uvicorn nirmantra_ai.api.app:app --host 127.0.0.1 --port 8000 --reload
```

### Interactive API Explorers:
- **Swagger UI (Interactive Playground)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc (API Specification Reference)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **OpenAPI JSON Spec**: `http://127.0.0.1:8000/openapi.json`

CORS is pre-configured with `allow_origins=["*"]`, allowing frontends running on `localhost:3000`, `localhost:5173`, or any dev port to communicate without proxy configuration.

---

## 3. API Endpoints Reference

### 3.1. System Health Check
- **Route:** `GET /health`
- **Description:** Verifies service readiness, active rules count, vector store chunk count, and LLM provider.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "app": "Nirmaantra AI",
  "version": "0.1.0",
  "jurisdiction": "Delhi NCT, India",
  "rules_loaded": 7,
  "regulations_loaded": 4,
  "llm_provider": "OpenAILLMClient",
  "ocr_available": false
}
```

---

### 3.2. List Registered Compliance Rules
- **Route:** `GET /api/v1/rules`
- **Description:** Lists all active statutory rules, categories, citations, and bye-law authorities.
- **Response `200 OK`:**
```json
{
  "jurisdiction": "Delhi NCT, India",
  "total_rules": 7,
  "rules": [
    {
      "rule_id": "DELHI_UBBL_2016_SETBACK_FRONT",
      "name": "Minimum Front Setback Requirement",
      "category": "setback",
      "citation": "Unified Building Bye-Laws for Delhi 2016, Clause 7.14.1, Table 7.1",
      "authority": "DDA / MCD",
      "description": "Evaluates Front Setback according to plot area under UBBL 2016 Clause 7.14.1."
    },
    {
      "rule_id": "DELHI_UBBL_2016_FAR_MAX",
      "name": "Maximum Permissible Floor Area Ratio (FAR)",
      "category": "far_and_coverage",
      "citation": "Unified Building Bye-Laws for Delhi 2016, Table 7.1 (Residential Plotted)",
      "authority": "DDA / MCD",
      "description": "Evaluates FAR against Delhi UBBL 2016 Table 7.1 limits based on plot size."
    },
    {
      "rule_id": "DELHI_DFS_CLEARANCE_REQUIRED",
      "name": "Delhi Fire Service (DFS) Clearance Trigger",
      "category": "fire_safety",
      "citation": "Unified Building Bye-Laws for Delhi 2016, Clause 9.3 & Delhi Fire Service Act",
      "authority": "DFS",
      "description": "Mandatory prior Fire Clearance / NOC trigger for buildings exceeding 15m in height."
    }
  ]
}
```

---

### 3.3. Analyze Document File (Upload PDF or Image)
- **Route:** `POST /api/v1/analyze-file`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: Binary file (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.tiff`).
  - `project_name` (optional): String override for project title.
- **Response `200 OK`:** Returns full `ComplianceReport` JSON.

#### cURL Example:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/analyze-file" \
  -F "file=@data/sample/demo_suryoday_apartments.pdf" \
  -F "project_name=Suryoday Apartments"
```

---

### 3.4. Analyze Drawing Text / Schedule Notes
- **Route:** `POST /api/v1/analyze-text`
- **Content-Type:** `application/json`
- **Payload:**
```json
{
  "text": "Project: Lotus Heights\nPlot Area: 450 sq.m\nBuilt-up Area: 1100 sq.m\nHeight: 14.5 m\nFront Setback: 6.2 m\nRear Setback: 3.5 m",
  "project_name": "Lotus Heights"
}
```
- **Response `200 OK`:** Returns full `ComplianceReport` JSON.

---

### 3.5. Direct Parameter Compliance Evaluation (Form / Calculator)
- **Route:** `POST /api/v1/analyze-parameters`
- **Content-Type:** `application/json`
- **Description:** For web UI calculators and municipal manual entry forms where users input numbers directly. Bypasses document parsing.
- **Payload:**
```json
{
  "project_name": {"value": "Rohini Heights"},
  "plot_area_sqm": {"value": 500.0},
  "total_builtup_area_sqm": {"value": 1100.0},
  "ground_coverage_sqm": {"value": 320.0},
  "building_height_m": {"value": 14.8},
  "setbacks": {
    "front_m": {"value": 6.5},
    "rear_m": {"value": 3.2}
  }
}
```
- **Response `200 OK`:** Returns full `ComplianceReport` JSON.

---

### 3.6. Export Existing Report as PDF Certificate
- **Route:** `POST /api/v1/report/pdf`
- **Content-Type:** `application/json`
- **Payload:** Full `ComplianceReport` JSON object (obtained from `/api/v1/analyze-file` or `/api/v1/analyze-text`).
- **Response `200 OK`:** Binary PDF file stream (`application/pdf`) with `Content-Disposition: attachment; filename="compliance_audit_<id>.pdf"`.

#### JavaScript / React Download Example:
```typescript
const downloadPdfReport = async (report: ComplianceReport) => {
  const response = await fetch('http://127.0.0.1:8000/api/v1/report/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance_audit_${report.project_name.replace(/\s+/g, '_')}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

---

### 3.7. Direct Upload & PDF Certificate Download
- **Route:** `POST /api/v1/analyze-file/pdf`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: Building submission drawing (`.pdf`, `.png`, `.jpg`).
  - `project_name` (optional): Title override.
- **Response `200 OK`:** Directly streams the compiled PDF certificate (`application/pdf`).

#### cURL Download Example:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/analyze-file/pdf" \
  -F "file=@data/sample/demo_suryoday_apartments.pdf" \
  -F "project_name=Suryoday Apartments" \
  --output suryoday_audit_certificate.pdf
```

---

## 4. TypeScript Type Definitions

Copy and paste these TypeScript types into your frontend project (e.g. `types/compliance.ts`):

```typescript
export type OverallComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_REVIEW';
export type RuleStatus = 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';
export type Confidence = 'high' | 'medium' | 'low' | 'unknown';

export interface FieldProvenance<T> {
  value: T | null;
  raw_snippet?: string | null;
  page_number?: number | null;
  confidence: Confidence;
  is_inferred: boolean;
}

export interface ReportSummary {
  overall_status: OverallComplianceStatus;
  total_requirements_checked: number;
  passed_count: number;
  failed_count: number;
  needs_review_count: number;
  not_applicable_count: number;
  compliance_score_percent: number;
}

export interface GroundedFinding {
  rule_id: string;
  rule_name: string;
  status: RuleStatus;
  explanation: string;
  regulatory_citations: string[];
  next_steps: string[];
}

export interface ComplianceReport {
  report_id: string;
  generated_at: string; // ISO 8601 string
  project_name: string;
  location_address?: string | null;
  source_document?: string | null;
  jurisdiction: string;
  summary: ReportSummary;
  findings: GroundedFinding[];
  missing_information_checklist: string[];
  actionable_recommendations: string[];
  disclaimer: string;
}
```

---

## 5. Frontend Integration Code Examples

### 5.1. React / Next.js File Upload Hook

```tsx
// hooks/useComplianceAudit.ts
import { useState } from 'react';
import { ComplianceReport } from '../types/compliance';

const API_BASE = process.env.NEXT_PUBLIC_NIRMAANTRA_API_URL || 'http://127.0.0.1:8000';

export function useComplianceAudit() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = async (file: File, projectName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (projectName) {
        formData.append('project_name', projectName);
      }

      const res = await fetch(`${API_BASE}/api/v1/analyze-file`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Server error ${res.status}`);
      }

      const data: ComplianceReport = await res.json();
      setReport(data);
      return data;
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { report, isLoading, error, analyzeFile };
}
```

### 5.2. React Component Example

```tsx
// components/ComplianceResultsCard.tsx
import React from 'react';
import { ComplianceReport, RuleStatus } from '../types/compliance';

const statusBadges: Record<RuleStatus, { label: string; color: string }> = {
  PASS: { label: 'PASS', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  FAIL: { label: 'FAIL', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  NEEDS_REVIEW: { label: 'REVIEW', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  NOT_APPLICABLE: { label: 'N/A', color: 'bg-slate-100 text-slate-700 border-slate-300' },
};

export const ComplianceResultsCard: React.FC<{ report: ComplianceReport }> = ({ report }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{report.project_name}</h2>
          <p className="text-sm text-slate-500">Jurisdiction: {report.jurisdiction}</p>
          <p className="text-xs text-slate-400 font-mono mt-1">Audit ID: {report.report_id}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold text-indigo-600">
            {report.summary.compliance_score_percent}%
          </div>
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border mt-1 ${
            report.summary.overall_status === 'COMPLIANT'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}>
            {report.summary.overall_status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Evaluated Statutory Rules</h3>
        {report.findings.map((finding) => {
          const badge = statusBadges[finding.status];
          return (
            <div key={finding.rule_id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-800">{finding.rule_name}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{finding.explanation}</p>
              {finding.regulatory_citations.length > 0 && (
                <div className="text-xs text-slate-500 italic">
                  Statutory Citation: {finding.regulatory_citations.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mandatory Statutory Disclaimer */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
          Mandatory Legal & Professional Disclaimer
        </h4>
        <p className="text-xs text-amber-800 leading-relaxed">{report.disclaimer}</p>
      </div>
    </div>
  );
};
```

---

## 6. HTTP Status Codes & Error Responses

| Status Code | Meaning | Cause |
|---|---|---|
| `200 OK` | Analysis succeeded | Valid JSON `ComplianceReport` returned. |
| `400 BAD REQUEST` | Invalid input format | Unsupported file extension, missing filename. |
| `422 UNPROCESSABLE` | Validation / OCR error | Input text under 10 chars, encrypted PDF, or missing OCR engine. |
| `500 INTERNAL ERROR` | Pipeline execution failure | LLM communication failure or unexpected engine exception. |

### Standard Error JSON Format:
```json
{
  "detail": "Failed to process document 'drawing.pdf': PDF is encrypted/password-protected"
}
```

---

## 7. Frontend UI Recommendations

1. **Badge Conventions**:
   - `PASS`: Solid Emerald Green (`#059669`)
   - `FAIL`: Solid Rose Red (`#E11D48`)
   - `NEEDS_REVIEW`: Amber / Warning Yellow (`#D97706`)
   - `NOT_APPLICABLE`: Slate Gray (`#64748B`)
2. **Prominent Legal Disclaimer**:
   - The disclaimer contained in `report.disclaimer` must remain visible on the UI or download export to comply with regulatory advisory standards.
3. **Actionable Checklist**:
   - Display `report.missing_information_checklist` as an interactive checklist so architects know exactly which details (e.g. rear setback dimension, staircase width) need to be added to drawings.
