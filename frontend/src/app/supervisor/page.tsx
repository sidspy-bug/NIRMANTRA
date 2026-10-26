"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HardHat,
  Layers,
  ChevronRight,
  FileCheck2,
  Calendar,
  UserCheck,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationRecord, InspectionRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

function SupervisorDashboardContent() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [apps, insps] = await Promise.all([
        NirmaantraApi.getApplications(),
        NirmaantraApi.getInspections(),
      ]);
      setApplications(apps);
      setInspections(insps);
      setLoading(false);
    }
    loadData();
  }, []);

  const pendingReviews = applications.filter(
    (a) => a.status === "Under Human Review" || a.status === "Submitted" || a.status === "Awaiting AI Analysis"
  );
  const approvedRecords = applications.filter((a) => a.status === "Approved");
  const overrideCount = applications.filter((a) => !!a.supervisorOverride).length;
  const overdueInspections = inspections.filter((i) => i.status === "Overdue").length;

  return (
    <div className="space-y-6">
      {/* 1. Executive Summary Statistics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Reviews (BUTTON 4 destination) */}
        <Link href="/applications?tab=supervisor" className="group block">
          <div className="bg-white rounded-lg border border-amber-200 p-4 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Pending Reviews (3-4 Days)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900 group-hover:text-amber-700 transition-colors">
                {loading ? "..." : pendingReviews.length}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold">In Review Queue</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Awaiting supervisory determination</p>
          </div>
        </Link>

        {/* Metric 2: Review History & Audits (BUTTON 5 destination) */}
        <Link href="/applications?tab=approved" className="group block">
          <div className="bg-white rounded-lg border border-purple-200 p-4 shadow-2xs hover:border-purple-400 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Sanctioned Approvals</span>
              <FileCheck2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900 group-hover:text-purple-700 transition-colors">
                {loading ? "..." : approvedRecords.length}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">Verified Certificates</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Audit trails & sanction letters</p>
          </div>
        </Link>

        {/* Metric 3: Disclosed Overrides */}
        <Link href="/applications?tab=approved" className="group block">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Disclosed AI Overrides</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {loading ? "..." : overrideCount}
              </span>
              <span className="text-[11px] text-slate-600">Rule 14 Filings</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Publicly disclosed justifications</p>
          </div>
        </Link>

        {/* Metric 4: Field Audit Oversight */}
        <Link href="/inspections?tab=overdue" className="group block">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Overdue Field Audits</span>
              <HardHat className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-red-700">
                {loading ? "..." : overdueInspections}
              </span>
              <span className="text-[11px] text-red-600 font-semibold">15-Day Rule Breach</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Ward enforcement required</p>
          </div>
        </Link>
      </div>

      {/* 2. Core Dashboard Operational Navigation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUTTON 4: Application Reviews */}
        <div className="bg-white rounded-lg border border-amber-300 p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#d85a38] text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  PRIMARY SUPERVISORY ACTION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Application Reviews
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Access submitted building plans awaiting municipal zonal determination and architectural compliance verification. Review proposals under the mandatory 3-4 days scrutiny window.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              {pendingReviews.length} Proposals Pending Review
            </span>
            <Link href="/applications?tab=supervisor">
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-9 px-4 font-semibold shadow-xs">
                Open Application Reviews <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* BUTTON 5: Review History & Audits */}
        <div className="bg-white rounded-lg border border-purple-200 p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#2a1b4e] text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                  STATUTORY AUDIT REPOSITORY
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Review History & Audits
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Examine approved building plans, verified digital sanction certificates, reviewer determinations, and transparently disclosed supervisory overrides with written statutory justifications.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
              {approvedRecords.length} Sanctioned Records
            </span>
            <Link href="/applications?tab=approved">
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-9 px-4 font-semibold shadow-xs">
                View Review History & Audits <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Immediate Active Scrutiny Roster */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardHeader className="p-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Immediate Scrutiny Roster (Priority Queue)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Proposals requiring supervisory determination under the 3-4 days statutory scrutiny policy.
              </CardDescription>
            </div>
            <Link href="/applications?tab=supervisor">
              <Button variant="outline" size="sm" className="text-xs font-semibold border-slate-300">
                View All Pending Reviews ({pendingReviews.length}) <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading scrutiny queue...
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Scrutiny Desk Clear</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All submitted building plans have been reviewed. There are no pending proposals in the queue.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingReviews.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {app.id}
                      </span>
                      <Badge variant="warning" className="text-[10px]">
                        {app.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {app.buildingCategory}
                      </Badge>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{app.buildingName}</h4>

                    <p className="text-xs text-slate-600">
                      {app.plotAddress}, {app.city} • Applicant: {app.applicantName}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] pt-0.5">
                      <span className="text-slate-500">
                        Submitted: {new Date(app.submittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                      {app.humanReviewDeadline && (
                        <span className="text-amber-700 font-semibold flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Target Review: {new Date(app.humanReviewDeadline).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <Link href={`/applications/${app.id}`}>
                      <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8 px-3 font-semibold shadow-xs">
                        Review Dossier <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupervisorReviewPage() {
  return (
    <RoleGuard allowedRoles={["Supervisor"]}>
      <PageContainer
        title="Municipal Supervisor Scrutiny & Determination Desk"
        description="Authorized municipal review desk for building plan approvals, statutory compliance verifications, and auditable AI override determinations."
        breadcrumbs={[
          { label: "Municipal Desk", href: "/supervisor" },
          { label: "Supervisor Dashboard" },
        ]}
        action={
          <div className="flex items-center space-x-2">
            <Link href="/applications?tab=supervisor">
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold shadow-xs">
                <Layers className="w-3.5 h-3.5 mr-1.5" /> Application Reviews
              </Button>
            </Link>
            <Link href="/applications?tab=approved">
              <Button variant="outline" className="text-xs font-semibold border-slate-300">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Review History & Audits
              </Button>
            </Link>
          </div>
        }
      >
        <SupervisorDashboardContent />
      </PageContainer>
    </RoleGuard>
  );
}
