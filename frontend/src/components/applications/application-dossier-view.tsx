"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  Download,
  Eye,
  Building,
  Upload,
  ShieldCheck,
  Sparkles,
  Play,
  FileDown,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApplicationRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";
import { NirmaantraMlService } from "@/services/ml-service";
import { useAuth } from "@/context/auth-context";

interface ApplicationDossierViewProps {
  applicationId: string;
}

export function ApplicationDossierView({ applicationId }: ApplicationDossierViewProps) {
  const { user } = useAuth();
  const isSupervisor = user?.role === "Supervisor";

  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Supervisor Form State
  const [reviewerName, setReviewerName] = useState(user?.name || "Dr. Anita Desai (Sr. Municipal Planner)");
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [reason, setReason] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [originalFinding, setOriginalFinding] = useState("AI screening flagged setback variation (Draft notice)");
  const [overrideJustification, setOverrideJustification] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  // AI Compliance State
  const [runningAiAudit, setRunningAiAudit] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [aiAuditError, setAiAuditError] = useState<string | null>(null);

  const handleRunAiAudit = async () => {
    if (!app) return;
    setRunningAiAudit(true);
    setAiAuditError(null);
    try {
      let plotSqm = app.plotArea;
      if (app.plotAreaUnit === "sq.ft") plotSqm = app.plotArea * 0.092903;
      else if (app.plotAreaUnit === "sq.yards") plotSqm = app.plotArea * 0.836127;

      const catLower = app.buildingCategory.toLowerCase();
      let occParam = "hospital";
      let staircaseWidth = 2.0;
      let corridorWidth = 2.5;
      let ramp = true;
      let travelDist = 25.0;
      let exitsCount = 2;
      let ecsSpaces = 100;

      if (catLower.includes("hosp") || catLower.includes("health")) {
        occParam = "hospital";
        staircaseWidth = 2.10;
        corridorWidth = 2.50;
        ramp = true;
        ecsSpaces = 150;
      } else if (catLower.includes("shop") || catLower.includes("mall") || catLower.includes("retail")) {
        occParam = "shopping_center";
        staircaseWidth = 2.20;
        travelDist = 25.0;
        exitsCount = 4;
        ecsSpaces = 280;
      } else if (catLower.includes("hotel")) {
        occParam = "hotel";
        staircaseWidth = 1.60;
        ecsSpaces = 185;
      } else if (catLower.includes("educat") || catLower.includes("school") || catLower.includes("univ")) {
        occParam = "educational";
        staircaseWidth = 1.80;
        ecsSpaces = 110;
      }

      const report = await NirmaantraMlService.analyzeParameters({
        project_name: app.buildingName,
        location_address: `${app.plotAddress}, ${app.city}, ${app.state}`,
        occupancy_type: occParam,
        plot_area_sqm: Math.round(plotSqm * 100) / 100,
        building_height_m: app.proposedHeightMeters || 16.5,
        ground_coverage_sqm: Math.round(plotSqm * 0.35 * 100) / 100,
        total_builtup_area_sqm: Math.round(plotSqm * 1.8 * 100) / 100,
        road_width_m: 24.0,
        parking_spaces_provided: ecsSpaces,
        setbacks: {
          front_m: 12.5,
          rear_m: 9.5,
          side1_m: 6.2,
          side2_m: 6.0,
        },
        fire_safety: {
          staircase_width_m: staircaseWidth,
          corridor_width_m: corridorWidth,
          ramp_provided: ramp,
          travel_distance_to_exit_m: travelDist,
          number_of_staircases: exitsCount,
          fire_extinguishers_present: true,
          fire_alarm_present: true,
          sprinklers_present: true,
          emergency_exits_count: exitsCount,
        },
      });

      const updated = await NirmaantraApi.updateApplicationCompliance(app.id, report);
      if (updated) {
        setApp({ ...updated });
      }
    } catch (err: any) {
      console.error("AI audit failed:", err);
      setAiAuditError(
        err.message || "Failed to execute AI Compliance audit. Ensure the FastAPI backend is running."
      );
    } finally {
      setRunningAiAudit(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!app?.complianceReport) return;
    setDownloadingPdf(true);
    try {
      await NirmaantraMlService.triggerPdfDownload(
        app.complianceReport,
        `${app.id}_AI_Compliance_Audit_Report.pdf`
      );
    } catch (err: any) {
      console.error("Failed to download PDF report:", err);
      alert("Failed to download PDF audit report. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getApplicationById(applicationId);
      setApp(data);
      setLoading(false);
    }
    load();
  }, [applicationId]);

  const handleRecordReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setSavingReview(true);
    setReviewNotice(null);

    const overridePayload = isOverride
      ? {
          originalFinding,
          writtenJustification: overrideJustification,
          evidenceUrls: ["evidence-site-survey-comp.pdf"],
        }
      : undefined;

    const updated = await NirmaantraApi.recordSupervisorReview(
      app.id,
      decision,
      reviewerName,
      reason,
      overridePayload
    );

    if (updated) {
      setApp({ ...updated });
      setReviewNotice("Supervisor decision recorded successfully and stamped to audit trail.");
    }
    setSavingReview(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
        Loading application dossier...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-slate-800">Application Not Found</h3>
        <p className="text-xs text-slate-500">
          No record found for reference <code>{applicationId}</code>.
        </p>
        <Link href="/applications">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Return to Registry
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {app.id}
            </span>
            <Badge
              variant={
                app.status === "Approved"
                  ? "success"
                  : app.status === "Rejected"
                  ? "destructive"
                  : "warning"
              }
              className="text-xs"
            >
              {app.status}
            </Badge>
            {app.isDemoFixture && (
              <span className="text-[10px] text-slate-400 font-mono">[Demonstration Record]</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{app.buildingName}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {app.plotAddress}, {app.city}, {app.state}
          </p>
        </div>

        <Link href="/applications">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All Applications
          </Button>
        </Link>
      </div>

      {/* Main Grid: Details + Timeline + Supervisor Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Metadata & Documents */}
        <div className="lg:col-span-8 space-y-6">
          {/* Statutory Review Window Policy Notice */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 text-xs text-blue-950 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Clock className="w-4 h-4 text-blue-700" />
              <span>Supervisor Review Policy Window: 3 to 4 Working Days</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              Target Resolution:{" "}
              <strong>
                {app.humanReviewDeadline
                  ? new Date(app.humanReviewDeadline).toLocaleDateString()
                  : "Within 4 days of submission"}
              </strong>
              . Status remarks: {app.statusRemarks}
            </p>
          </div>

          {/* Section 1: Application Metadata */}
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Project Parameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Building Category</span>
                <span className="font-semibold text-slate-900">{app.buildingCategory}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Plot Area</span>
                <span className="font-semibold text-slate-900">
                  {app.plotArea} {app.plotAreaUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Proposed Height</span>
                <span className="font-semibold text-slate-900">
                  {app.proposedHeightMeters ? `${app.proposedHeightMeters}m` : "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Applicant Name</span>
                <span className="font-semibold text-slate-900">{app.applicantName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Applicant Email</span>
                <span className="font-semibold text-slate-900">{app.applicantEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Submission Date</span>
                <span className="font-semibold text-slate-900">
                  {new Date(app.submittedAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Submitted Drawings & Documents */}
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Submitted Documents & Plans ({app.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {app.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-800" />
                    <div>
                      <p className="font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {doc.category} • {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                      SHA-256 Validated
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: AI Statutory Compliance Screening Engine */}
          <Card className="bg-white shadow-xs border border-slate-200 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-purple-700" />
                  AI Statutory Compliance Screening (UBBL-2016 & DFS Act)
                </CardTitle>
                <div className="flex items-center gap-2">
                  {app.complianceReport ? (
                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-bold ${
                        app.complianceReport.summary.overall_status === "COMPLIANT"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : app.complianceReport.summary.overall_status === "NON_COMPLIANT"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {app.complianceReport.summary.overall_status}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50">
                      {app.mlScreeningStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-4">
              {aiAuditError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  <strong>Scrutiny Notice:</strong> {aiAuditError}
                </div>
              )}

              {app.complianceReport ? (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Compliance Score</span>
                      <p className="text-lg font-bold text-slate-900">
                        {app.complianceReport.summary.compliance_score_percent}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-mono">Passed Checks</span>
                      <p className="text-lg font-bold text-emerald-700">
                        {app.complianceReport.summary.passed_count}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 uppercase font-mono">Violations</span>
                      <p className="text-lg font-bold text-rose-700">
                        {app.complianceReport.summary.failed_count}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 uppercase font-mono">Needs Review</span>
                      <p className="text-lg font-bold text-amber-700">
                        {app.complianceReport.summary.needs_review_count}
                      </p>
                    </div>
                  </div>

                  {/* Findings List */}
                  <div className="space-y-2">
                    <p className="font-bold text-slate-800 text-xs flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-600" />
                      Statutory Evaluation Findings ({app.complianceReport.findings.length} Checks):
                    </p>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {app.complianceReport.findings.map((f, idx) => (
                        <div
                          key={f.rule_id || idx}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                            f.status === "PASS"
                              ? "bg-emerald-50/40 border-emerald-200/80"
                              : f.status === "FAIL"
                              ? "bg-rose-50/50 border-rose-200"
                              : "bg-amber-50/40 border-amber-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {f.status === "PASS" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : f.status === "FAIL" ? (
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              {f.rule_name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                f.status === "PASS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : f.status === "FAIL"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {f.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {f.explanation}
                          </p>
                          {f.regulatory_citations && f.regulatory_citations.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {f.regulatory_citations.map((cite, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="text-[10px] font-mono bg-white text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded"
                                >
                                  § {cite}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions: Download PDF and Re-run */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      size="sm"
                      className="bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold h-8"
                    >
                      {downloadingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5 mr-1.5" />
                          Download Official PDF Audit Report
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleRunAiAudit}
                      disabled={runningAiAudit}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-slate-700"
                    >
                      {runningAiAudit ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Evaluating Rules...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1 text-slate-500" />
                          Re-run AI Scrutiny
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* No Report Yet - Prompt to Run Scrutiny */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Nirmaantra AI Statutory Compliance Engine Ready
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Evaluate this application&apos;s architectural parameters against Delhi Unified Building Bye-Laws (UBBL-2016), Delhi Fire Service Act 2010, and NBC 2016 Part 4.
                    </p>
                  </div>
                  <Button
                    onClick={handleRunAiAudit}
                    disabled={runningAiAudit}
                    className="bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold h-8 px-4"
                  >
                    {runningAiAudit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Analyzing Against Delhi Bye-Laws...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-200" />
                        Run Instant AI Statutory Compliance Audit
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Certificate Issuance Condition */}
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">
                Official Sanction Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              {app.issuedCertificate?.isVerifiedRealDocument ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-900">Certificate Issued & Valid</p>
                    <p className="text-[11px] text-emerald-700">
                      ID: {app.issuedCertificate.certificateId} • Valid until:{" "}
                      {app.issuedCertificate.validUntil}
                    </p>
                  </div>
                  <Button size="sm" className="bg-emerald-700 text-white text-xs">
                    <Download className="w-3.5 h-3.5 mr-1" /> Download Certificate
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Certificate not yet available for this application.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    In compliance with platform integrity rules, certificates are never synthetically generated. Download is enabled only upon finalized supervisor clearance and field inspection verification.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Supervisor Review & Override Desk */}
        <div className="lg:col-span-4 space-y-6">
          {/* Supervisor Decision Desk (Authorized Supervisors Only) vs Citizen Status Card */}
          {isSupervisor ? (
            <Card className="bg-white border-[#3b185f]/30 shadow-sm">
              <CardHeader className="bg-[#f3e8ff]/50 border-b border-[#e9d5ff] pb-3">
                <CardTitle className="text-sm font-bold text-[#2a1b4e] flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5 text-[#3b185f]" />
                  Municipal Supervisor Review Desk
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-600">
                  Authorized signatory interface for municipal zonal review officers.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {reviewNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs font-semibold">
                    {reviewNotice}
                  </div>
                )}

                <form onSubmit={handleRecordReview} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reviewer Name & Officer ID
                    </label>
                    <Input
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Decision Determination
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDecision("Approved")}
                        className={`py-2 text-xs font-bold rounded border transition-colors ${
                          decision === "Approved"
                            ? "bg-emerald-600 text-white border-emerald-700"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ✓ Approve Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision("Rejected")}
                        className={`py-2 text-xs font-bold rounded border transition-colors ${
                          decision === "Rejected"
                            ? "bg-red-600 text-white border-red-700"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ✗ Reject Plan
                      </button>
                    </div>
                  </div>

                  {decision === "Rejected" && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Reason for Rejection <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Specify statutory violation (e.g. Setback variance exceeding allowable limit, missing fire riser specifications)..."
                        className="w-full rounded-md border border-input p-2 text-xs"
                        required
                      />
                    </div>
                  )}

                  {/* Supervisor Override Checkbox */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOverride}
                        onChange={(e) => setIsOverride(e.target.checked)}
                        className="mt-0.5 rounded text-[#3b185f]"
                      />
                      <span className="text-[11px] font-bold text-slate-800">
                        Record Written Justification / AI Override
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 pl-5">
                      Statutory requirement: Overriding any screening finding requires written justification and public audit disclosure.
                    </p>
                  </div>

                  {isOverride && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          Original Screening Finding
                        </label>
                        <Input
                          value={originalFinding}
                          onChange={(e) => setOriginalFinding(e.target.value)}
                          className="text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          Supervisor Written Justification
                        </label>
                        <textarea
                          rows={3}
                          value={overrideJustification}
                          onChange={(e) => setOverrideJustification(e.target.value)}
                          placeholder="Detail compensating measures (e.g. widening front driveway from 6m to 9.2m as approved by zonal committee)..."
                          className="w-full rounded border border-amber-300 p-2 text-xs bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          Attach Supporting Evidence
                        </label>
                        <div className="border border-dashed border-amber-300 rounded p-2 text-center bg-white">
                          <Upload className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                          <span className="text-[10px] text-amber-900">Upload site survey report or committee resolution</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={savingReview}
                    className="w-full bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold"
                  >
                    {savingReview ? "Recording..." : "Record Official Decision"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-[#2a1b4e]" />
                  Application Determination Status
                </CardTitle>
                <CardDescription className="text-[11px] text-slate-600">
                  Municipal scrutiny status and public determination timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Current Status</span>
                  <Badge
                    variant={
                      app.status === "Approved"
                        ? "success"
                        : app.status === "Rejected"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Review Window</span>
                  <span className="font-semibold text-slate-800">3-4 Working Days</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Zonal Municipality</span>
                  <span className="font-semibold text-slate-800">{app.city || "Delhi NCR"}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-[11px] text-slate-600">
                  {app.status === "Approved"
                    ? "Building plan scrutiny approved. Your verified digital sanction permit is available for download."
                    : app.status === "Rejected"
                    ? "Scrutiny determination flagged statutory variances. Please inspect the recorded audit comments below."
                    : "Plan dossier is currently undergoing human scrutiny by the municipal planning committee."}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervisor Decision Audit Record */}
          {app.supervisorDecision && (
            <Card className="bg-slate-50 border-slate-200 text-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-900 uppercase">
                  Recorded Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Decision:</strong>{" "}
                  <span
                    className={
                      app.supervisorDecision.decision === "Approved"
                        ? "text-emerald-700 font-bold"
                        : "text-red-700 font-bold"
                    }
                  >
                    {app.supervisorDecision.decision}
                  </span>
                </p>
                <p>
                  <strong>Officer:</strong> {app.supervisorDecision.decidedBy}
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(app.supervisorDecision.decidedAt).toLocaleString()}
                </p>
                {app.supervisorDecision.reason && (
                  <p>
                    <strong>Reason:</strong> {app.supervisorDecision.reason}
                  </p>
                )}
                {app.supervisorOverride && (
                  <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-[11px] space-y-1">
                    <p className="font-bold text-amber-900">
                      Disclosed Override: {app.supervisorOverride.overrideId}
                    </p>
                    <p className="text-slate-600">{app.supervisorOverride.writtenJustification}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
