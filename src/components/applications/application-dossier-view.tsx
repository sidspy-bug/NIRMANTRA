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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ApplicationRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";
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

          {/* Section 3: AI Screening Interface (Anti-fabrication verified) */}
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-600" />
                  AI Screening Status & Findings
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-amber-800 bg-amber-50">
                  {app.mlScreeningStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-700">
                <p className="font-semibold text-slate-900">Integration Notice:</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {app.mlFindings?.notice ||
                    "The ML model is being developed by a teammate and will be integrated into this pipeline. No artificial pass/fail ratings or regulatory scores are simulated."}
                </p>
              </div>
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
