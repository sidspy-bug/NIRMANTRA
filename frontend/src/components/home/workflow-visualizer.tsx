"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Cpu,
  UserCheck,
  CheckCircle2,
  Calendar,
  Camera,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  MessageSquareWarning,
  ArrowRight,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function WorkflowVisualizer() {
  const { user } = useAuth();
  const role = user?.role || "General Public";
  const isPublic = role === "General Public";

  const [activeWorkflow, setActiveWorkflow] = useState<"plan" | "inspection" | "uid" | "grievance">("plan");

  return (
    <section className="py-10 border-t border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              NIRMAANTRA Statutory System Workflows
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            End-to-end statutory architectural verification, mandatory audits, and civic transparency protocols.
          </p>
        </div>

        {/* Workflow Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveWorkflow("plan")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeWorkflow === "plan"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Plan Submission
          </button>
          {!isPublic && (
            <button
              onClick={() => setActiveWorkflow("inspection")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeWorkflow === "inspection"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Inspection Dept
            </button>
          )}
          <button
            onClick={() => setActiveWorkflow("uid")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeWorkflow === "uid"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isPublic ? "2. Building UID & QR" : "3. Building UID & QR"}
          </button>
          <button
            onClick={() => setActiveWorkflow("grievance")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeWorkflow === "grievance"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isPublic ? "3. Public Grievances" : "4. Public Grievances"}
          </button>
        </div>
      </div>

      {/* 1. Plan Submission Workflow */}
      {activeWorkflow === "plan" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-base font-bold text-slate-900">Submit Building Plan – Workflow</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Public submits building details & map → AI analysis → 3–4 days human review → Final decision
              </p>
            </div>
            <Link href="/services/submit-plan">
              <Button size="sm" className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs">
                Open Submission Form
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d85a38] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                <h4 className="text-xs font-bold text-slate-900">Enter Details</h4>
              </div>
              <p className="text-[11px] text-slate-600">Building Name, Plot / Survey No., Height & Built-up Area, Occupancy Group.</p>
              <div className="pt-2 text-[10px] text-slate-400 font-mono">Form Validation ✓</div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d85a38] text-white flex items-center justify-center text-[11px] font-bold">2</span>
                <h4 className="text-xs font-bold text-slate-900">Upload Documents</h4>
              </div>
              <p className="text-[11px] text-slate-600">Architectural blueprint in PDF/DXF, structural safety affidavit, fire NOC.</p>
              <div className="pt-2 text-[10px] text-slate-400 font-mono">SHA-256 Hashing ✓</div>
            </div>

            {/* Step 3 */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold">3</span>
                <h4 className="text-xs font-bold text-blue-950">AI Analysis</h4>
              </div>
              <p className="text-[11px] text-blue-800">Automated check on FAR ratios, rear/front setbacks, fire exit paths.</p>
              <div className="pt-2 text-[10px] text-emerald-700 font-bold font-mono">100% Rules Scrutinized</div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d85a38] text-white flex items-center justify-center text-[11px] font-bold">4</span>
                <h4 className="text-xs font-bold text-slate-900">Human Review</h4>
              </div>
              <p className="text-[11px] text-slate-600">Assigned Municipal Town Planner verifies AI flags within 3-4 working days.</p>
              <div className="pt-2 text-[10px] text-amber-700 font-semibold font-mono">Digital Signature Pending</div>
            </div>

            {/* Step 5 */}
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">5</span>
                <h4 className="text-xs font-bold text-emerald-950">Final Sanction</h4>
              </div>
              <p className="text-[11px] text-emerald-800">Provisional permit generated, permanent QR code issued for public display.</p>
              <div className="pt-2 text-[10px] text-emerald-800 font-bold font-mono">Certificate Ready ✓</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Inspection Department Workflow */}
      {activeWorkflow === "inspection" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-base font-bold text-slate-900">Inspection Department – Workflow</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Approved buildings → 6-month inspection → upload photos → AI analysis → report → 15-day buffer → ID block
              </p>
            </div>
            <Link href="/inspections">
              <Button size="sm" className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs">
                View Inspection Desk
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-[#ea580c]">Step 1: Dashboard</span>
              <h4 className="text-xs font-bold text-slate-900">Roster & Assignment</h4>
              <p className="text-[11px] text-slate-600">Auto-allocated inspector roster. 6-month recurring check triggered.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-[#ea580c]">Step 2: Field Visit</span>
              <h4 className="text-xs font-bold text-slate-900">Upload 10-20 Photos</h4>
              <p className="text-[11px] text-slate-600">Geotagged site captures of setbacks, risers, escape passages.</p>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-800">Step 3: AI Scrutiny</span>
              <h4 className="text-xs font-bold text-blue-950">Visual Verification</h4>
              <p className="text-[11px] text-blue-800">AI compares photos with sanctioned blueprint for deviations.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-[#ea580c]">Step 4: Report</span>
              <h4 className="text-xs font-bold text-slate-900">Statutory Report</h4>
              <p className="text-[11px] text-slate-600">Standardized PDF generated with officer endorsement seal.</p>
            </div>
            <div className="bg-red-50/70 border border-red-200 rounded-lg p-4 space-y-1.5">
              <span className="text-[11px] font-bold text-red-700">Step 5: Accountability</span>
              <h4 className="text-xs font-bold text-red-950">15-Day Hard Limit</h4>
              <p className="text-[11px] text-red-700">Failure to conduct visit triggers auto-lock of inspector ID.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Building UID & QR Workflow */}
      {activeWorkflow === "uid" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-xs font-bold">3</span>
                <h3 className="text-base font-bold text-slate-900">Building UID & QR – Workflow</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                After approval & operational verification → issue unique ID → scannable QR → public view
              </p>
            </div>
            <Link href="/buildings/NB-DL-2026-881">
              <Button size="sm" className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs">
                Inspect Sample QR
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Step 1: Building Approved</h4>
              <p className="text-xs text-slate-600">All structural audits and NBC fire guidelines certified by Directorate.</p>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-5 space-y-2 text-center">
              <QrCode className="w-8 h-8 text-blue-900 mx-auto" />
              <h4 className="text-sm font-bold text-blue-950">Step 2: Generate UID & QR</h4>
              <p className="text-xs text-blue-800">Dynamic encrypted QR code generated with unique UID (e.g. NB12345678).</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2 text-center">
              <Download className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Step 3: Public Display & Scan</h4>
              <p className="text-xs text-slate-600">Mounted at building entrance for instant scan by residents and visitors.</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Public Grievances Workflow */}
      {activeWorkflow === "grievance" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-[#ea580c] text-white flex items-center justify-center text-xs font-bold">4</span>
                <h3 className="text-base font-bold text-slate-900">Public Grievances – Workflow</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Citizen files violation report with evidence → Municipal review & field order → Redressal logged in building record
              </p>
            </div>
            <Link href="/grievances/submit">
              <Button size="sm" className="bg-red-700 hover:bg-red-800 text-white text-xs">
                File a Violation
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2 text-center">
              <MessageSquareWarning className="w-8 h-8 text-[#ea580c] mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Step 1: Submit Complaint</h4>
              <p className="text-xs text-slate-600">Citizen uploads photo/video of setback violation or locked fire exits.</p>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-5 space-y-2 text-center">
              <UserCheck className="w-8 h-8 text-amber-700 mx-auto" />
              <h4 className="text-sm font-bold text-amber-950">Step 2: Review & Action</h4>
              <p className="text-xs text-amber-900">48h mandatory review by Ward Officer; stop-work order issued if verified.</p>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-5 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-950">Step 3: Public Accountability</h4>
              <p className="text-xs text-emerald-900">Outcome publicly stamped onto Building UID record for transparent oversight.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
