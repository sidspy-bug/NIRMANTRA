"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Award,
  FileCheck,
  ExternalLink,
  Calendar,
  Lock,
  Building,
  RotateCcw,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";
import { useAuth } from "@/context/auth-context";

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSupervisor = user?.role === "Supervisor";

  // URL query parameter synchronization
  const rawTab = searchParams.get("tab") || "all";
  const validTabs = isSupervisor
    ? ["all", "supervisor", "approved", "rejected"]
    : ["all", "under_review", "approved", "rejected"];
  
  const currentTab = isSupervisor
    ? (["all", "supervisor", "approved", "rejected"].includes(rawTab) ? rawTab : "all")
    : (["all", "under_review", "approved", "rejected"].includes(rawTab) ? rawTab : (rawTab === "supervisor" ? "supervisor" : "all"));

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getApplications();
      setApplications(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const queryString = params.toString();
    router.push(`/applications${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  // Role Protection: If non-supervisor accesses ?tab=supervisor
  const isUnauthorizedSupervisorTab = currentTab === "supervisor" && !isSupervisor;

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.id.toLowerCase().includes(search.toLowerCase()) ||
      app.buildingName.toLowerCase().includes(search.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.plotAddress.toLowerCase().includes(search.toLowerCase()) ||
      (app.city && app.city.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      filterCategory === "All" ||
      app.buildingCategory === filterCategory ||
      (filterCategory === "Educational" && app.buildingCategory.toLowerCase().includes("educat")) ||
      (filterCategory === "Hospital" && app.buildingCategory.toLowerCase().includes("hosp")) ||
      (filterCategory === "Hotel" && app.buildingCategory.toLowerCase().includes("hotel")) ||
      (filterCategory === "Shopping Center" && (app.buildingCategory.toLowerCase().includes("shop") || app.buildingCategory.toLowerCase().includes("mall")));

    let matchesTab = true;
    if (currentTab === "supervisor") {
      matchesTab = app.status === "Under Human Review" || app.status === "Submitted" || app.status === "Awaiting AI Analysis";
    } else if (currentTab === "under_review") {
      matchesTab = app.status === "Under Human Review" || app.status === "Submitted" || app.status === "Awaiting AI Analysis";
    } else if (currentTab === "approved") {
      matchesTab = app.status === "Approved";
    } else if (currentTab === "rejected") {
      matchesTab = app.status === "Rejected" || app.status === "Clarification Requested";
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Calculate live counts for badges
  const pendingCount = applications.filter(
    (a) => a.status === "Under Human Review" || a.status === "Submitted" || a.status === "Awaiting AI Analysis"
  ).length;
  const approvedCount = applications.filter((a) => a.status === "Approved").length;
  const rejectedCount = applications.filter(
    (a) => a.status === "Rejected" || a.status === "Clarification Requested"
  ).length;

  return (
    <div className="space-y-6">
      {/* Search & Tabs Strip */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Application No. (e.g. BLD-2026-98124), building name, or address..."
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium"
            >
              <option value="All">All Focus Categories</option>
              <option value="Hospital">Hospital & Healthcare</option>
              <option value="Shopping Center">Shopping Centers & Malls</option>
              <option value="Hotel">Commercial Hotels</option>
              <option value="Educational">Educational Buildings</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs synchronized with URL ?tab= */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              currentTab === "all"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isSupervisor ? `All Applications (${applications.length})` : `My Applications (${applications.length})`}
          </button>

          {isSupervisor ? (
            <button
              type="button"
              onClick={() => handleTabChange("supervisor")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
                currentTab === "supervisor"
                  ? "bg-[#2a1b4e] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Application Reviews</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentTab === "supervisor" ? "bg-amber-400 text-slate-900 font-bold" : "bg-slate-200 text-slate-700 font-bold"
              }`}>
                {pendingCount}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleTabChange("under_review")}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
                currentTab === "under_review"
                  ? "bg-[#2a1b4e] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>Under Scrutiny (3-4 Days)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold font-mono">
                {pendingCount}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabChange("approved")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
              currentTab === "approved"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>{isSupervisor ? "Review History & Audits" : "Approved Plans"}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              currentTab === "approved" ? "bg-emerald-400 text-slate-900 font-bold" : "bg-slate-200 text-slate-700 font-bold"
            }`}>
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rejected")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center space-x-1.5 ${
              currentTab === "rejected"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>Rejected / Clarifications</span>
            {rejectedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold font-mono">
                {rejectedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Role Protection Banner for unauthorized ?tab=supervisor */}
      {isUnauthorizedSupervisorTab ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 border border-red-200 text-red-800">
              RESTRICTED MUNICIPAL QUEUE
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Access Restricted — Scrutiny Supervisor Role Required
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              The <strong>Supervisor Review Queue</strong> is strictly reserved for authorized municipal scrutiny supervisors. Your current authenticated session is registered as <strong>{user?.role || "General Public"}</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => handleTabChange("all")}
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-9 px-4 font-semibold"
            >
              View My Applications
            </Button>
            <Link href="/login">
              <Button
                variant="outline"
                className="text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Switch Account / Login as Supervisor
              </Button>
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#2a1b4e] animate-spin mx-auto" />
          <p>Loading building plan applications registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200 space-y-3">
          {currentTab === "supervisor" ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Applications Awaiting Review</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All submitted building plan applications have been processed. There are currently no dossiers awaiting supervisory determination or compliance review.
              </p>
            </>
          ) : currentTab === "approved" ? (
            <>
              <Award className="w-10 h-10 text-purple-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Approved Plans or Audit Records Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No approved building plans match your filter criteria. Completed approvals, sanction certificates, and statutory audit trails will appear here.
              </p>
            </>
          ) : currentTab === "rejected" ? (
            <>
              <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Rejected Applications or Clarifications</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no building plan submissions marked as rejected or requiring architectural clarifications.
              </p>
            </>
          ) : currentTab === "under_review" ? (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Applications Under Active Scrutiny</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You do not have any building plan proposals currently undergoing statutory officer review.
              </p>
            </>
          ) : (
            <>
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Applications Found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No plan proposals matched your search query. You can register a new proposal or clear search filters.
              </p>
            </>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterCategory("All");
                handleTabChange("all");
              }}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card
              key={app.id}
              className={`bg-white transition-all shadow-2xs hover:shadow-sm ${
                currentTab === "supervisor"
                  ? "border-amber-200 hover:border-amber-400"
                  : currentTab === "approved"
                  ? "border-purple-200 hover:border-[#3b185f]"
                  : "border-slate-200 hover:border-[#3b185f]/40"
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header Information Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center space-x-2">
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
                        className="text-[10px]"
                      >
                        {app.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {app.buildingCategory}
                      </Badge>
                      {app.isDemoFixture && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          [Official Demonstration Fixture]
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <span>{app.buildingName}</span>
                    </h3>

                    <p className="text-xs text-slate-600">
                      {app.plotAddress}, {app.city} • Plot Area: {app.plotArea} {app.plotAreaUnit}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Applicant: <span className="font-semibold text-slate-700">{app.applicantName}</span> ({app.applicantEmail}) • Submitted:{" "}
                      {new Date(app.submittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500">ML Pre-Screening:</span>
                        <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {app.mlScreeningStatus}
                        </span>
                      </div>
                      {app.humanReviewAssignedTo && (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assigned Reviewer: <strong className="text-slate-800">{app.humanReviewAssignedTo}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                    <Link href={`/applications/${app.id}`}>
                      <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8 px-4 font-semibold shadow-xs">
                        View Dossier & Review Desk <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>

                    {app.humanReviewDeadline && (
                      <span className="text-[11px] text-slate-600 font-medium flex items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        Target Review Window: {new Date(app.humanReviewDeadline).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Information Box (for BUTTON 5: Review History & Audits) */}
                {(app.status === "Approved" || app.supervisorDecision || app.supervisorOverride) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-lg space-y-3">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                        Statutory Determination & Audit Record
                      </h4>
                      <Badge variant="outline" className="text-[9px] bg-white text-purple-900 border-purple-200">
                        Official Decision Trail
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Supervisor Decision Details */}
                      {app.supervisorDecision && (
                        <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Supervisor Decision</span>
                            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                              {app.supervisorDecision.decision}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Decided By: <strong className="text-slate-900">{app.supervisorDecision.decidedBy}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Timestamp: {new Date(app.supervisorDecision.decidedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                          {app.supervisorDecision.reason && (
                            <p className="text-[11px] text-slate-700 italic border-l-2 border-purple-400 pl-2 pt-0.5">
                              &ldquo;{app.supervisorDecision.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Issued Sanction Certificate */}
                      {app.issuedCertificate && (
                        <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Sanction Certificate</span>
                            <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                              {app.issuedCertificate.certificateId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Issued: {new Date(app.issuedCertificate.issuedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} • Valid Until: <strong className="text-slate-800">{new Date(app.issuedCertificate.validUntil).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            {app.issuedCertificate.verificationNotice}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Disclosed Supervisor Override (Mandatory Transparency) */}
                    {app.supervisorOverride && (
                      <div className="bg-amber-50/70 border border-amber-200 p-3 rounded space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-bold text-amber-900 text-[11px]">
                            Disclosed Supervisor Override [Rule 14 Transparency Mandate]
                          </span>
                          <span className="font-mono text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                            Override #{app.supervisorOverride.overrideId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          Reviewer: <strong>{app.supervisorOverride.reviewerName}</strong> ({app.supervisorOverride.reviewerRole}) • {new Date(app.supervisorOverride.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                        <p className="text-[11px] text-slate-700">
                          Original Flag: <span className="font-mono text-amber-900">{app.supervisorOverride.originalFinding}</span>
                        </p>
                        <div className="p-2 bg-white rounded border border-amber-200 text-[11px] text-slate-800">
                          <strong>Written Statutory Justification:</strong> &ldquo;{app.supervisorOverride.writtenJustification}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <PageContainer
      title="Building Plan Scrutiny & Application Register"
      description="Track statutory clearance stages, AI pre-screening integration statuses, and authorized municipal supervisor review desks."
      breadcrumbs={[
        { label: "Building Services", href: "#" },
        { label: "Application Registry" },
      ]}
      action={
        <Link href="/services/submit-plan">
          <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold shadow-xs">
            + Submit New Building Plan
          </Button>
        </Link>
      }
    >
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Applications...</div>}>
        <ApplicationsContent />
      </Suspense>
    </PageContainer>
  );
}
